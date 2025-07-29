'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function login(prevState: any, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMessage = fieldErrors.username?.[0] || fieldErrors.password?.[0] || '아이디와 비밀번호를 모두 입력해주세요.';
      return { error: errorMessage };
  }

  const { username, password } = parsed.data;
  
  // .env.local 파일에서 환경 변수를 읽어옵니다.
  // 파일이 없거나 서버 재시작이 안된 경우를 대비해 기본값을 설정합니다.
  const adminUsername = process.env.CARECONNECT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.CARECONNECT_ADMIN_PASSWORD || 'password';

  if (username !== adminUsername || password !== adminPassword) {
    console.log(`Login failed. Input: '${username}', Expected: '${adminUsername}'`);
    return { error: '아이디 또는 비밀번호가 잘못되었습니다.' };
  }
  
  // 로그인 성공 시 쿠키 설정
  try {
    cookies().set({
        name: 'session',
        value: 'admin-logged-in',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });
  } catch (error) {
      console.error('Cookie setting failed:', error);
      return { error: '세션 설정에 실패했습니다. 다시 시도해주세요.' };
  }
    
  // 리디렉션
  redirect('/admin');
}

export async function logout() {
  cookies().delete('session');
  redirect('/login');
}
