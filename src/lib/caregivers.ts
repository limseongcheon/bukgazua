
import Database from 'better-sqlite3';
import type { Caregiver } from '@/types/caregiver-types';
import { unstable_noStore as noStore } from 'next/cache';
import path from 'path';
import fs from 'fs';

// 데이터베이스 파일 경로 설정
// 참고: Firebase App Hosting의 쓰기 가능한 유일한 디렉토리는 /tmp 입니다.
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/careconnect.db' 
  : path.join(process.cwd(), 'careconnect.db');


console.log(`[DB] Database path: ${dbPath}`);

const db = new Database(dbPath);

// 테이블 초기화 로직
const initTable = () => {
    db.exec(`
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
            unavailableDates TEXT NOT NULL DEFAULT '[]'
        );
    `);
    console.log('[DB] "caregivers" table structure verified.');

    // specialNotes 컬럼이 존재하는지 확인하고, 없으면 추가 (마이그레이션)
    const columns = db.prepare(`PRAGMA table_info(caregivers)`).all();
    const hasSpecialNotes = columns.some((col: any) => col.name === 'specialNotes');

    if (!hasSpecialNotes) {
        console.log('[DB] "specialNotes" column not found. Altering table...');
        db.exec(`ALTER TABLE caregivers ADD COLUMN specialNotes TEXT`);
        console.log('[DB] "specialNotes" column added successfully.');
    }


    // 샘플 데이터 추가 로직 (테이블이 비어있을 경우에만 실행)
    const count = db.prepare('SELECT COUNT(*) as count FROM caregivers').get() as { count: number };
    if (count.count === 0) {
        console.log('[DB] No data found. Seeding initial caregivers...');
        const insert = db.prepare(`
            INSERT INTO caregivers (name, phone, photoUrl, birthDate, gender, certifications, experience, unavailableDates, status, specialNotes)
            VALUES (@name, @phone, @photoUrl, @birthDate, @gender, @certifications, @experience, @unavailableDates, @status, @specialNotes)
        `);

        db.transaction(() => {
            insert.run({
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
            });
            insert.run({
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
            });
        })();
        console.log('[DB] Initial data seeded.');
    }
};

// 애플리케이션 시작 시 테이블 초기화
initTable();


const parseCaregiver = (row: any): Caregiver => {
    return {
        ...row,
        unavailableDates: JSON.parse(row.unavailableDates || '[]'),
    };
};

type NewCaregiverData = Omit<Caregiver, 'id' | 'unavailableDates'> & { specialNotes?: string | null };
type UpdateCaregiverData = Partial<Omit<Caregiver, 'id'>>;

export async function getCaregivers(): Promise<Caregiver[]> {
  noStore();
  const stmt = db.prepare('SELECT * FROM caregivers ORDER BY id DESC');
  const rows = stmt.all() as any[];
  return rows.map(parseCaregiver);
}

export async function addCaregiverToDb(caregiverData: NewCaregiverData): Promise<Caregiver> {
    const { name, phone, photoUrl, birthDate, gender, certifications, experience, status, specialNotes } = caregiverData;
    const stmt = db.prepare(`
        INSERT INTO caregivers (name, phone, photoUrl, birthDate, gender, certifications, experience, unavailableDates, status, specialNotes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
        const info = stmt.run(name, phone, photoUrl || null, birthDate, gender, certifications || null, experience || null, '[]', status, specialNotes || null);
        const getStmt = db.prepare('SELECT * FROM caregivers WHERE id = ?');
        const newCaregiver = getStmt.get(info.lastInsertRowid) as any;
        return parseCaregiver(newCaregiver);
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('이미 등록된 전화번호입니다.');
        }
        throw error;
    }
}

export async function updateCaregiverInDb(id: number, updateData: UpdateCaregiverData): Promise<Caregiver> {
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    if (fields.length === 0) {
        throw new Error('수정할 데이터가 없습니다.');
    }

    // `unavailableDates` 필드는 JSON 문자열로 변환해야 함
    const dataToUpdate: any = { ...updateData };
    if (dataToUpdate.unavailableDates && Array.isArray(dataToUpdate.unavailableDates)) {
        dataToUpdate.unavailableDates = JSON.stringify(dataToUpdate.unavailableDates);
    }
    
    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    const stmt = db.prepare(`UPDATE caregivers SET ${setClause} WHERE id = @id`);
    
    const info = stmt.run({ ...dataToUpdate, id });

    if (info.changes === 0) {
        throw new Error('해당 ID의 간병인을 찾을 수 없거나 변경된 내용이 없습니다.');
    }

    const getStmt = db.prepare('SELECT * FROM caregivers WHERE id = ?');
    const updatedCaregiver = getStmt.get(id) as any;
    return parseCaregiver(updatedCaregiver);
}


export async function deleteCaregiversFromDb(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM caregivers WHERE id IN (${placeholders})`);
    
    const info = stmt.run(...ids);
    return info.changes;
}
