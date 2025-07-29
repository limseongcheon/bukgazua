// src/lib/settings.ts
'use server';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * .env.local 파일에서 설정된 관리자 이메일 목록을 가져옵니다.
 * CARECONNECT_ADMIN_EMAIL_1 부터 CARECONNECT_ADMIN_EMAIL_5 까지의
 * 환경 변수를 읽어 유효한 이메일 주소만 배열로 반환합니다.
 * @returns {Promise<string[]>} 관리자 이메일 주소 배열
 */
export const getAdminEmails = async (): Promise<string[]> => {
  noStore(); // 데이터 캐싱을 비활성화합니다.
  
  const emails: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const email = process.env[`CARECONNECT_ADMIN_EMAIL_${i}`];
    if (email) {
      emails.push(email);
    }
  }
  
  return emails;
};
