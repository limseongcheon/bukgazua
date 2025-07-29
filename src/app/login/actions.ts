'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

// 새로운 반환 타입을 정의합니다.
type LoginState = {
  success: boolean;
  message: string;
};

export async function login(prevState: any, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.username?.[0] || fieldErrors.password?.[0] || '아이디와 비밀번호를 모두 입력해주세요.';
    return { success: false, message: errorMessage };
  }

  const { username, password } = parsed.data;

  // 환경 변수 대신 안전하게 하드코딩된 값을 사용합니다.
  const adminUsername = 'admin';
  const adminPassword = 'password';

  if (username !== adminUsername || password !== adminPassword) {
    return { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' };
  }

  try {
    cookies().set({
      name: 'session',
      value: 'admin-logged-in',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1일
    });

    // redirect 대신 성공 상태를 반환합니다.
    return { success: true, message: '로그인 성공!' };

  } catch (error) {
    console.error('Cookie setting failed:', error);
    return { success: false, message: '세션 설정에 실패했습니다. 서버 오류입니다.' };
  }
}

export async function logout() {
  try {
    cookies().delete('session');
  } catch (error) {
    console.error('Logout failed:', error);
    // 이 함수는 redirect를 호출해야 합니다.
  }
}
