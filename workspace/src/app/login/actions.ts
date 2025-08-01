'use server';

import 'dotenv/config'; // .env 파일을 명시적으로 로드합니다.
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function login(prevState: any, formData: FormData) {
  try {
    const parsed = schema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const errorMessage = fieldErrors.username?.[0] || fieldErrors.password?.[0] || '아이디와 비밀번호를 모두 입력해주세요.';
        return { error: errorMessage };
    }

    const { username, password } = parsed.data;
    
    const adminUsername = process.env.CARECONNECT_ADMIN_USERNAME;
    const adminPassword = process.env.CARECONNECT_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return { error: '서버에 관리자 정보가 설정되지 않았습니다. .env 파일을 확인해주세요.' };
    }

    if (username !== adminUsername || password !== adminPassword) {
      console.log(`Login failed. Input: '${username}', Expected: '${adminUsername}'`);
      return { error: '아이디 또는 비밀번호가 잘못되었습니다.' };
    }
    
    cookies().set({
        name: 'session',
        value: 'admin-logged-in',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });

  } catch (error) {
    console.error('Login action failed:', error);
    if (error instanceof Error && error.message.includes('cookies')) {
        return { error: '세션 설정에 실패했습니다. 서버 환경을 확인해주세요.'};
    }
    return { error: '로그인 중 알 수 없는 오류가 발생했습니다.' };
  }
  // This must be called outside of the try/catch block.
  redirect('/admin');
}

export async function logout() {
  try {
    cookies().delete('session');
  } catch(error) {
     console.error('Logout failed:', error);
  }
  redirect('/login');
}
