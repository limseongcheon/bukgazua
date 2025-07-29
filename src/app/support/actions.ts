
'use server';

import { z } from 'zod';
import { submitSupportApplicationEmail } from '@/app/actions';

const SupportFormSchema = z.object({
  name: z.string().min(1, '성명을 입력해주세요.'),
  contact: z.string().regex(/^\d+$/, "(-) 없이 숫자만 입력해주세요.").min(10, '정확한 연락처를 입력해주세요.'),
  region: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "하나 이상의 지역을 선택해주세요.",
  }),
  birthDate: z.string().min(1, '생년월일을 입력해주세요.'),
  gender: z.enum(['남성', '여성'], { required_error: '성별을 선택해주세요.' }),
  photoDataUri: z.string().optional(),
  certifications: z.string().optional(),
  experience: z.string().min(1, '경력을 선택해주세요.'),
  selfIntroduction: z.string().optional(),
});

export async function submitSupportApplication(prevState: any, formData: FormData) {
  const validatedFields = SupportFormSchema.safeParse({
    name: formData.get('name'),
    contact: formData.get('contact'),
    region: formData.getAll('region'),
    birthDate: formData.get('birthDate'),
    gender: formData.get('gender'),
    photoDataUri: formData.get('photoDataUri'),
    certifications: formData.get('certifications'),
    experience: formData.get('experience'),
    selfIntroduction: formData.get('selfIntroduction'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '입력 내용을 다시 확인해주세요.',
    };
  }

  try {
    const result = await submitSupportApplicationEmail(validatedFields.data);
    
    if (result.success) {
      return { message: result.message, errors: {} };
    } else {
      return { message: result.message, errors: {} };
    }

  } catch (error) {
    console.error('[Support Action Error]', error);
    return { message: '서버 오류로 인해 지원서 제출에 실패했습니다. 관리자에게 문의해주세요.', errors: {} };
  }
}
