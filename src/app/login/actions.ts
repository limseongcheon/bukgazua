'use server';

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
    
    const adminUsername = 'admin';
    const adminPassword = 'password';

    // 디버깅을 위한 로그 추가: 서버가 받은 값을 확인합니다.
    console.log(`[Login Attempt] Received username: "${username}" | Received password: "${'*'.repeat(password.length)}"`);
    console.log(`[Login Check] Comparing with adminUsername: "${adminUsername}" | adminPassword: "********"`);
    
    if (username !== adminUsername || password !== adminPassword) {
      console.error(`[Login Failed] Credentials do not match.`);
      return { error: '아이디 또는 비밀번호가 잘못되었습니다.' };
    }
    
    console.log('[Login Success] Credentials match. Setting cookie.');
    cookies().set({
        name: 'session',
        value: 'admin-logged-in',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });

  } catch (error) {
    console.error('[Login Action Error] An unexpected error occurred:', error);
    if (error instanceof Error && error.message.includes('cookies')) {
        return { error: '세션 설정에 실패했습니다. 서버 환경을 확인해주세요.'};
    }
    return { error: '로그인 중 알 수 없는 오류가 발생했습니다.' };
  }
  
  // 성공 시 리디렉션
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
