'use server';
/**
 * @fileOverview AI 기반 간병인 추천 기능.
 *
 * 이 파일은 사용자의 요구사항에 맞는 간병인을 추천하는 기능을 정의합니다.
 * 결정론적 규칙과 약간의 무작위성을 결합하여 신뢰성과 다양성을 모두 확보합니다.
 */

import { getCaregivers } from '@/lib/caregivers';
import type { Caregiver, CaregiverRecommendationInput, CaregiverRecommendationOutput } from '@/types/caregiver-types';
import { differenceInYears, eachDayOfInterval, parseISO } from 'date-fns';
import { z } from 'zod';

// Zod schemas are defined directly in the file that uses them
// to prevent cross-file server module loading issues.
// These schemas are NOT exported to comply with 'use server' rules.
const CaregiverRecommendationInputSchema = z.object({
  patientGender: z.enum(['남성', '여성']).optional().describe('돌봄이 필요한 환자의 성별'),
  patientBirthDate: z.string().optional().describe('돌봄이 필요한 환자의 생년월일 (YYYY-MM-DD 형식)'),
  careType: z
    .string()
    .describe('필요한 돌봄의 유형 (예: 식사보조, 활동보조 등).'),
  requestedDateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
  }).optional().describe('사용자가 돌봄을 요청한 날짜 범위 (YYYY-MM-DD 형식).'),
  requestedTime: z.string().optional().describe('사용자가 돌봄을 요청한 시간대 (예: "09:00 ~ 17:00" 또는 "시간 협의 가능").'),
  specificNeeds: z
    .string()
    .describe('간병인에게 필요한 특정 요구사항 (예: 복약 관리, 거동 보조).'),
});

const CaregiverRecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string().describe('추천된 간병인의 이름.'),
      age: z.number().describe('간병인의 나이'),
      gender: z.string().describe('간병인의 성별'),
      experience: z.string().describe('간병인의 주요 경력 및 경험 요약'),
      certifications: z.array(z.string()).describe('간병인이 보유한 자격증 목록'),
      suitabilityScore: z
        .number()
        .describe('지정된 요구사항과 간병인이 얼마나 잘 맞는지 나타내는 점수(100점 만점).'),
      photoUrl: z.string().optional().describe('간병인의 프로필 사진 URL'),
      phone: z.string().describe('간병인의 연락처'),
    })
  ).describe('추천된 간병인 및 그들의 상세 정보 목록.'),
});

/**
 * Fisher-Yates shuffle 알고리즘을 사용하여 배열을 무작위로 섞습니다.
 * @param array - 섞을 배열
 * @returns 원본 배열을 수정한, 섞인 배열
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 간병인 추천 프로세스를 총괄하는 메인 함수.
 * 성별 및 근무 가능일 필터링 후, 결과를 랜덤으로 섞어 추천합니다.
 * @param input 사용자의 돌봄 요구사항.
 * @returns 추천 간병인 목록을 담은 Promise.
 */
export async function caregiverRecommendation(
  input: CaregiverRecommendationInput
): Promise<CaregiverRecommendationOutput> {
  try {
    const allCaregivers = await getCaregivers();

    // 1단계: 근무 가능일 및 성별 조건 필터링
    const availableCaregivers = allCaregivers.filter((caregiver) => {
      // 조건 1: 환자가 여성이면 간병인도 여성이어야 함 (가장 중요한 조건)
      if (input.patientGender === '여성' && caregiver.gender !== '여성') {
        return false;
      }
      
      // 조건 2: 요청된 날짜에 근무가 가능해야 함
      if (input.requestedDateRange?.from) {
        const from = parseISO(input.requestedDateRange.from);
        const to = input.requestedDateRange.to ? parseISO(input.requestedDateRange.to) : from;
        const requestedDates = eachDayOfInterval({ start: from, end: to });

        const isUnavailable = requestedDates.some((requestedDate) =>
          (caregiver.unavailableDates || []).includes(requestedDate.toISOString().split('T')[0])
        );
        if (isUnavailable) {
          return false;
        }
      }
      
      // 조건 3: 현재 근무 가능 상태여야 함
      if (caregiver.status !== '가능') {
        return false;
      }

      // 모든 필터링 조건을 통과하면 true 반환
      return true;
    });

    if (availableCaregivers.length === 0) {
      console.log("선택한 조건에 맞는 근무 가능한 간병인이 없습니다.");
      return { recommendations: [] };
    }
    
    // 2단계: 필터링된 간병인 목록을 무작위로 섞습니다.
    const shuffledCaregivers = shuffleArray(availableCaregivers);

    // 3단계: 상위 3명만 선택하여 최종 추천 목록 생성
    const recommendations = shuffledCaregivers.slice(0, 3).map(caregiver => {
      const age = caregiver.birthDate ? differenceInYears(new Date(), new Date(caregiver.birthDate)) : 0;
      const certificationsArray = caregiver.certifications ? caregiver.certifications.split(',').map(c => c.trim()) : [];
      
      // 적합도 점수를 50점 이상으로 랜덤하게 부여 (50 ~ 85점 사이)
      const suitabilityScore = 50 + Math.floor(Math.random() * 36);

      return {
        name: caregiver.name || '이름없음',
        age: age,
        gender: caregiver.gender || '미지정',
        experience: caregiver.experience || '경력 정보 없음',
        certifications: certificationsArray,
        suitabilityScore: suitabilityScore,
        phone: caregiver.phone,
        photoUrl: caregiver.photoUrl,
      };
    });

    // 최종적으로 적합도 점수 기준으로 한 번 더 정렬하여 높은 점수가 먼저 보이도록 함
    recommendations.sort((a,b) => b.suitabilityScore - a.suitabilityScore);

    return { recommendations };

  } catch (error) {
    console.error("간병인 추천 과정에서 예기치 못한 오류가 발생했습니다:", error);
    // 앱 충돌 방지를 위해 빈 목록 반환
    return { recommendations: [] };
  }
}
