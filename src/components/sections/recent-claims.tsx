'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { subDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Claim {
  name: string;
  claimType: string;
  date: string;
}

const names = ['김O민', '이O서', '박O준', '최O윤', '정O아', '강O진', '조O현', '윤O솔', '장O호', '임O연'];
const claimTypes = ['병원 간병비', '가족 간병비'];

// Hydration 오류를 막기 위해 정적 데이터 생성
const generateStaticClaims = (): Claim[] => {
  const today = new Date();
  const claims: Claim[] = [];
  for (let i = 0; i < 20; i++) {
    const name = names[i % names.length];
    const claimType = claimTypes[i % claimTypes.length];
    const date = format(subDays(today, i % 5), 'MM.dd', { locale: ko });
    claims.push({ name: `${name}님`, claimType, date });
  }
  return claims;
};

const staticClaims = generateStaticClaims();


export default function RecentClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    // 클라이언트에서만 실행되어야 하는 부작용을 방지하기 위해
    // 정적 데이터를 상태에 설정합니다.
    setClaims(staticClaims);
  }, []);

  if (claims.length === 0) {
    // 초기 렌더링 시나 데이터가 없을 때 아무것도 렌더링하지 않음
    return null; 
  }

  // 원활한 반복을 위해 목록을 복제합니다.
  const displayClaims = [...claims, ...claims];

  return (
    <section id="recent-claims" className="py-20 md:py-28 bg-background">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">
            보험서류 접수 현황
          </h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            천사손길을 통해 매일 많은 분들이 간병 서비스를 이용하고 보험 혜택을 받고 있습니다.
          </p>
        </div>
        <Card className="relative overflow-hidden shadow-lg p-6">
          <div className="w-fit flex animate-marquee-normal hover:animate-pause">
            {displayClaims.map((claim, index) => (
              <div key={index} className="flex-shrink-0 w-72 mx-2">
                <div className="p-4 bg-claim text-claim-foreground rounded-lg text-center">
                  <p className="font-semibold">{claim.name}</p>
                  <p className="font-medium text-sm">{claim.claimType}</p>
                  <p className="text-xs opacity-70 mt-1">{claim.date} 접수</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
