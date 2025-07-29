'use server';

import { z } from 'zod';
import { addCaregiver, setCaregiverUnavailability } from '@/lib/caregivers';
import { revalidatePath } from 'next/cache';
import { maskName } from '@/lib/utils';

const AddCaregiverFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  photoUrl: z.string().url('유효한 이미지 URL을 입력해주세요.'),
  age: z.coerce.number().min(18, '나이는 18세 이상이어야 합니다.'),
  gender: z.enum(['남성', '여성'], { required_error: '성별을 선택해주세요.' }),
  certifications: z.string().optional(),
  experience: z.string().min(1, '경력을 입력해주세요.'),
  skills: z.string().min(1, '기술을 하나 이상 입력해주세요.'),
});

type CaregiverActionState = {
  success: boolean;
  message: string;
  errors?: { [key: string]: string[] | undefined };
};

export async function addCaregiverAction(prevState: any, formData: FormData): Promise<CaregiverActionState> {
  try {
    const validatedFields = AddCaregiverFormSchema.safeParse({
      name: formData.get('name'),
      photoUrl: formData.get('photoUrl'),
      age: formData.get('age'),
      gender: formData.get('gender'),
      certifications: formData.get('certifications'),
      experience: formData.get('experience'),
      skills: formData.get('skills'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: '입력 내용을 다시 확인해주세요.',
      };
    }
    
    const { name, photoUrl, age, gender, certifications, experience, skills } = validatedFields.data;
    
    await addCaregiver({
      name,
      photoUrl,
      age,
      gender,
      certifications: certifications ? certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
      experience,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
    });

    revalidatePath('/admin');
    return { success: true, message: `'${maskName(name)}' 간병인이 성공적으로 추가되었습니다.` };
  } catch (error) {
    console.error(error);
    return { success: false, message: '서버 오류로 인해 간병인 추가에 실패했습니다.' };
  }
}


// =================================================================
// 간병인 일정 관리 액션
// =================================================================

interface UnavailabilityPayload {
  caregiverId: string;
  dates: string[];
}

const SetUnavailabilitySchema = z.object({
  caregiverId: z.string().min(1, '간병인 ID가 필요합니다.'),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다.')),
});

export async function setUnavailabilityAction(payload: UnavailabilityPayload): Promise<{success: boolean, message: string}> {
  try {
    const validatedFields = SetUnavailabilitySchema.safeParse(payload);

    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.flatten().fieldErrors.dates?.[0] ?? '잘못된 데이터가 전송되었습니다.';
      return { success: false, message: errorMessage };
    }

    await setCaregiverUnavailability(validatedFields.data.caregiverId, validatedFields.data.dates);
    revalidatePath('/admin');
    return { success: true, message: '일정이 성공적으로 업데이트되었습니다.' };
  } catch (error) {
    console.error('Error setting unavailability:', error);
    return { success: false, message: '일정 업데이트 중 서버 오류가 발생했습니다.' };
  }
}
