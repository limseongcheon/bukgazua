'use server';

import type { Caregiver } from '@/types/caregiver-types';
import { unstable_noStore as noStore } from 'next/cache';

// Using a simple in-memory array to simulate the database
// This removes the sqlite3/better-sqlite3 dependency completely.
let caregivers_db: Caregiver[] = [
  {
    id: 1,
    name: '김민준',
    phone: '010-1234-5678',
    photoUrl:
      'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    birthDate: '1978-05-15',
    gender: '남성',
    certifications: '요양보호사 1급, 간병사',
    experience: '10년 이상',
    unavailableDates: ['2024-08-15'],
    status: '가능',
    specialNotes: '거동이 불편하신 어르신 케어 전문입니다.',
  },
  {
    id: 2,
    name: '이서연',
    phone: '010-9876-5432',
    photoUrl:
      'https://images.unsplash.com/photo-1544717297-fa95b6ee8643?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    birthDate: '1985-11-20',
    gender: '여성',
    certifications: '간호조무사, 요양보호사 1급',
    experience: '10년 이상',
    unavailableDates: [],
    status: '가능',
    specialNotes: '여성 환자 및 수술 후 회복 환자 케어에 강점이 있습니다.',
  },
];
let nextId = caregivers_db.length + 1;


type NewCaregiverData = Omit<Caregiver, 'id' | 'unavailableDates'> & { specialNotes?: string | null };
type UpdateCaregiverData = Partial<Omit<Caregiver, 'id'>>;

export async function getCaregivers(): Promise<Caregiver[]> {
  noStore();
  // Return a copy, sorted by ID descending
  return [...caregivers_db].sort((a, b) => b.id - a.id);
}

export async function addCaregiverToDb(caregiverData: NewCaregiverData): Promise<Caregiver> {
    noStore();
    const { name, phone, photoUrl, birthDate, gender, certifications, experience, status, specialNotes } = caregiverData;
    
    if (caregivers_db.some((c) => c.phone === phone)) {
      throw new Error('이미 등록된 전화번호입니다.');
    }

    const newCaregiver: Caregiver = {
        id: nextId++,
        name,
        phone,
        photoUrl: photoUrl || undefined,
        birthDate,
        gender,
        certifications: certifications || undefined,
        experience: experience || undefined,
        status: status || '가능',
        specialNotes: specialNotes || undefined,
        unavailableDates: [],
    };

    caregivers_db.push(newCaregiver);
    return newCaregiver;
}


export async function updateCaregiverInDb(id: number, updateData: UpdateCaregiverData): Promise<Caregiver> {
    noStore();
    const caregiverIndex = caregivers_db.findIndex((c) => c.id === id);

    if (caregiverIndex === -1) {
        throw new Error('해당 ID의 간병인을 찾을 수 없습니다.');
    }
    
    const updatedCaregiver = {
        ...caregivers_db[caregiverIndex],
        ...updateData,
    };

    caregivers_db[caregiverIndex] = updatedCaregiver;
    return updatedCaregiver;
}


export async function deleteCaregiversFromDb(ids: number[]): Promise<number> {
    noStore();
    const initialLength = caregivers_db.length;
    caregivers_db = caregivers_db.filter((c) => !ids.includes(c.id));
    return initialLength - caregivers_db.length;
}
