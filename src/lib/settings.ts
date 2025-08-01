'use server';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * .env 파일 또는 Secret Manager에서 설정된 관리자 이메일 목록을 가져옵니다.
 * CARECONNECT_ADMIN_EMAIL_1 부터 CARECONNECT_ADMIN_EMAIL_5 까지 순차적으로 확인합니다.
 * @returns {Promise<string[]>} 관리자 이메일 주소 배열
 */
export const getAdminEmails = async (): Promise<string[]> => {
  noStore();
  
  const emails: string[] = [];
  // 환경 변수를 1번부터 5번까지 순차적으로 읽습니다.
  for (let i = 1; i <= 5; i++) {
    const emailKey = `CARECONNECT_ADMIN_EMAIL_${i}`;
    const email = process.env[emailKey];
    if (email && email.includes('@')) {
      emails.push(email);
    }
  }
  
  return emails;
};
