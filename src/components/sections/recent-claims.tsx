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

const generateDailyClaims = (): Claim[] => {
  const today = new Date();
  const claims: Claim[] = [];
  // Use day of the year as a seed to make the list different each day
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < 20; i++) {
    const seed = (dayOfYear + i) * 3;
    const name = names[seed % names.length];
    const claimType = claimTypes[seed % claimTypes.length];
    const date = format(subDays(today, i % 5), 'MM.dd', { locale: ko });
    claims.push({ name: `${name}님`, claimType, date });
  }
  return claims;
};


export default function RecentClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    // This runs only on the client-side to prevent hydration mismatch
    setClaims(generateDailyClaims());
  }, []);

  if (claims.length === 0) {
    // Render a placeholder or nothing on the server to prevent hydration errors
    return null;
  }

  // Duplicate the list for a seamless loop
  const displayClaims = [...claims, ...claims];

  return (
    <section id="recent-claims" className="py-20 md:py-28 bg-background">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            보험서류 접수 현황
          </h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            천사손길을 통해 매일 많은 분들이 간병 서비스를 이용하고 보험 혜택을 받고 있습니다.
          </p>
        </div>
        <Card className="relative overflow-hidden shadow-lg p-6 bg-secondary/50">
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
