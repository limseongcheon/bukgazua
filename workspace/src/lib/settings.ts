'use server';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * .env 파일에서 설정된 관리자 이메일 목록을 가져옵니다.
 * @returns {Promise<string[]>} 관리자 이메일 주소 배열
 */
export const getAdminEmails = async (): Promise<string[]> => {
  noStore();
  
  const emails: string[] = [];
  // 환경 변수를 직접 읽는 대신 빈 배열을 반환하도록 수정
  
  return emails;
};
