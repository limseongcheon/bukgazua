import { createClient, type Client } from '@libsql/client';
import type { Caregiver } from '@/types/caregiver-types';
import { unstable_noStore as noStore } from 'next/cache';

let db: Client;

function getClient() {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not defined in environment variables');
    }
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN is not defined in environment variables');
    }
    
    console.log('[DB] Creating new Turso client...');
    db = createClient({ url, authToken });
  }
  return db;
}


// 테이블 초기화 로직
const initTable = async () => {
    const client = getClient();
    await client.execute(`
        CREATE TABLE IF NOT EXISTS caregivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            photoUrl TEXT,
            birthDate TEXT NOT NULL,
            gender TEXT NOT NULL,
            certifications TEXT,
            experience TEXT,
            status TEXT NOT NULL DEFAULT '가능',
            unavailableDates TEXT NOT NULL DEFAULT '[]',
            specialNotes TEXT
        );
    `);
    console.log('[DB] "caregivers" table structure verified.');

    const { rows } = await client.execute('SELECT COUNT(*) as count FROM caregivers');
    const count = (rows[0]?.count as number) ?? 0;
    
    if (count === 0) {
        console.log('[DB] No data found. Seeding initial caregivers...');
        
        const sampleCaregivers = [
            {
                name: '김민준',
                phone: '010-1234-5678',
                photoUrl: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                birthDate: '1978-05-15',
                gender: '남성',
                certifications: '요양보호사 1급, 간병사',
                experience: '10년 이상',
                unavailableDates: JSON.stringify(['2024-08-15']),
                status: '가능',
                specialNotes: '거동이 불편하신 어르신 케어 전문입니다.'
            },
            {
                name: '이서연',
                phone: '010-9876-5432',
                photoUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee8643?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                birthDate: '1985-11-20',
                gender: '여성',
                certifications: '간호조무사, 요양보호사 1급',
                experience: '10년 이상',
                unavailableDates: JSON.stringify([]),
                status: '가능',
                specialNotes: '여성 환자 및 수술 후 회복 환자 케어에 강점이 있습니다.'
            }
        ];

        await client.batch(
            sampleCaregivers.map(cg => ({
                sql: `INSERT INTO caregivers (name, phone, photoUrl, birthDate, gender, certifications, experience, unavailableDates, status, specialNotes)
                      VALUES (:name, :phone, :photoUrl, :birthDate, :gender, :certifications, :experience, :unavailableDates, :status, :specialNotes)`,
                args: cg,
            })),
            'write'
        );
        console.log('[DB] Initial data seeded.');
    }
};

// 애플리케이션 시작 시 테이블 초기화를 비동기적으로 호출
initTable().catch(console.error);


const rowToCaregiver = (row: any): Caregiver => {
    const caregiver: any = {};
    Object.keys(row).forEach(key => {
        // id는 number 타입으로 변환
        if (key === 'id') {
            caregiver[key] = Number(row[key]);
        } else {
            caregiver[key] = row[key];
        }
    });

    return {
        ...caregiver,
        unavailableDates: JSON.parse(caregiver.unavailableDates || '[]'),
    } as Caregiver;
};


type NewCaregiverData = Omit<Caregiver, 'id' | 'unavailableDates'> & { specialNotes?: string | null };
type UpdateCaregiverData = Partial<Omit<Caregiver, 'id'>>;

export async function getCaregivers(): Promise<Caregiver[]> {
  noStore();
  const client = getClient();
  const { rows } = await client.execute('SELECT * FROM caregivers ORDER BY id DESC');
  return rows.map(rowToCaregiver);
}

export async function addCaregiverToDb(caregiverData: NewCaregiverData): Promise<Caregiver> {
    const client = getClient();
    const { name, phone, photoUrl, birthDate, gender, certifications, experience, status, specialNotes } = caregiverData;
    
    try {
        const result = await client.execute({
             sql: `INSERT INTO caregivers (name, phone, photoUrl, birthDate, gender, certifications, experience, unavailableDates, status, specialNotes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
             args: [name, phone, photoUrl || null, birthDate, gender, certifications || null, experience || null, '[]', status, specialNotes || null]
        });

        if (result.rows.length === 0) {
            throw new Error('Failed to add caregiver, no data returned.');
        }

        return rowToCaregiver(result.rows[0]);

    } catch (error: any) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            throw new Error('이미 등록된 전화번호입니다.');
        }
        console.error('Error in addCaregiverToDb:', error);
        throw new Error('간병인 등록 중 서버 오류가 발생했습니다.');
    }
}

export async function updateCaregiverInDb(id: number, updateData: UpdateCaregiverData): Promise<Caregiver> {
    const client = getClient();
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    if (fields.length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
    }

    const dataToUpdate: any = { ...updateData };
    if (dataToUpdate.unavailableDates && Array.isArray(dataToUpdate.unavailableDates)) {
        dataToUpdate.unavailableDates = JSON.stringify(dataToUpdate.unavailableDates);
    }
    
    const setClause = fields.map(field => `${field} = :${field}`).join(', ');
    
    const args = { ...dataToUpdate, id };

    const result = await client.execute({
        sql: `UPDATE caregivers SET ${setClause} WHERE id = :id RETURNING *`,
        args,
    });

    if (result.rows.length === 0) {
        throw new Error('해당 ID의 간병인을 찾을 수 없거나 변경된 내용이 없습니다.');
    }

    return rowToCaregiver(result.rows[0]);
}


export async function deleteCaregiversFromDb(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    
    const client = getClient();
    const placeholders = ids.map(() => '?').join(',');
    
    const result = await client.execute({
      sql: `DELETE FROM caregivers WHERE id IN (${placeholders})`,
      args: ids
    });
    
    return result.rowsAffected;
}