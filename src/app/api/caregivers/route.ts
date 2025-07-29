
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addCaregiverToDb, deleteCaregiversFromDb, getCaregivers as getCaregiversFromDb, updateCaregiverInDb } from '@/lib/caregivers';
import { revalidatePath } from 'next/cache';

const postSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다.'),
  phone: z.string().min(1, '전화번호는 필수입니다.'),
  photoUrl: z.string().url('유효한 URL을 입력해주세요.').optional().or(z.literal('')),
  birthDate: z.string().min(1, '생년월일은 필수입니다.'),
  gender: z.enum(['남성', '여성'], { required_error: '성별은 필수입니다.' }),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  specialNotes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedFields = postSchema.safeParse(body);

    if (!validatedFields.success) {
        const errorDetails = validatedFields.error.flatten().fieldErrors;
        const errorMessage = Object.values(errorDetails).flat()[0] || '잘못된 데이터입니다.';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    const newCaregiver = await addCaregiverToDb({
      ...validatedFields.data,
      status: '가능', // Set default status on creation
    });
    revalidatePath('/admin');
    return NextResponse.json({ success: true, newCaregiver }, { status: 201 });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : '알 수 없는 서버 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
        const caregivers = await getCaregiversFromDb();
        return NextResponse.json(caregivers);
    } catch (err: any) {
        const msg = err instanceof Error ? err.message : '알 수 없는 서버 오류가 발생했습니다.';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

const deleteSchema = z.object({
    ids: z.array(z.number()).min(1, '삭제할 ID가 필요합니다.'),
});

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedFields = deleteSchema.safeParse(body);
        
        if (!validatedFields.success) {
            return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
        }

        const deletedCount = await deleteCaregiversFromDb(validatedFields.data.ids);
        revalidatePath('/admin');
        return NextResponse.json({ success: true, count: deletedCount }, { status: 200 });
    } catch (err: any) {
        const msg = err instanceof Error ? err.message : '알 수 없는 서버 오류가 발생했습니다.';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

const putSchema = z.object({
  id: z.number(),
  name: z.string().min(1, '이름은 필수입니다.').optional(),
  phone: z.string().min(1, '전화번호는 필수입니다.').optional(),
  photoUrl: z.string().url('유효한 URL을 입력해주세요.').optional().or(z.literal('')),
  birthDate: z.string().min(1, '생년월일은 필수입니다.').optional(),
  gender: z.enum(['남성', '여성']).optional(),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  specialNotes: z.string().optional(),
  unavailableDates: z.array(z.string()).optional(),
  status: z.enum(['가능', '불가능']).optional(),
});


export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedFields = putSchema.safeParse(body);

        if (!validatedFields.success) {
            const errorDetails = validatedFields.error.flatten().fieldErrors;
            const errorMessage = Object.values(errorDetails).flat()[0] || '잘못된 데이터입니다.';
            return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
        }
        
        const { id, ...updateData } = validatedFields.data;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: '수정할 데이터가 없습니다.' }, { status: 400 });
        }

        const updatedCaregiver = await updateCaregiverInDb(id, updateData);
        revalidatePath('/admin');
        return NextResponse.json({ success: true, updatedCaregiver }, { status: 200 });

    } catch (err: any) {
        const msg = err instanceof Error ? err.message : '알 수 없는 서버 오류가 발생했습니다.';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
