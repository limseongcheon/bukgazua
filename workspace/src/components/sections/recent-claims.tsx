'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { subDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Claim {
  name: string;
  claimType: string;
  date: string;
}

// Pre-defined static data to avoid client-side computation and hydration errors.
const staticClaims: Claim[] = [
  { name: '김O민님', claimType: '병원 간병비', date: format(subDays(new Date(), 1), 'MM.dd', { locale: ko }) },
  { name: '이O서님', claimType: '가족 간병비', date: format(subDays(new Date(), 1), 'MM.dd', { locale: ko }) },
  { name: '박O준님', claimType: '병원 간병비', date: format(subDays(new Date(), 2), 'MM.dd', { locale: ko }) },
  { name: '최O윤님', claimType: '가족 간병비', date: format(subDays(new Date(), 2), 'MM.dd', { locale: ko }) },
  { name: '정O아님', claimType: '병원 간병비', date: format(subDays(new Date(), 3), 'MM.dd', { locale: ko }) },
  { name: '강O진님', claimType: '가족 간병비', date: format(subDays(new Date(), 3), 'MM.dd', { locale: ko }) },
  { name: '조O현님', claimType: '병원 간병비', date: format(subDays(new Date(), 4), 'MM.dd', { locale: ko }) },
  { name: '윤O솔님', claimType: '가족 간병비', date: format(subDays(new Date(), 4), 'MM.dd', { locale: ko }) },
  { name: '장O호님', claimType: '병원 간병비', date: format(subDays(new Date(), 5), 'MM.dd', { locale: ko }) },
  { name: '임O연님', claimType: '가족 간병비', date: format(subDays(new Date(), 5), 'MM.dd', { locale: ko }) },
  { name: '한O우님', claimType: '병원 간병비', date: format(subDays(new Date(), 6), 'MM.dd', { locale: ko }) },
  { name: '오O서님', claimType: '가족 간병비', date: format(subDays(new Date(), 6), 'MM.dd', { locale: ko }) },
  { name: '서O준님', claimType: '병원 간병비', date: format(subDays(new Date(), 1), 'MM.dd', { locale: ko }) },
  { name: '권O아님', claimType: '가족 간병비', date: format(subDays(new Date(), 2), 'MM.dd', { locale: ko }) },
  { name: '황O진님', claimType: '병원 간병비', date: format(subDays(new Date(), 3), 'MM.dd', { locale: ko }) },
  { name: '송O솔님', claimType: '가족 간병비', date: format(subDays(new Date(), 4), 'MM.dd', { locale: ko }) },
  { name: '유O호님', claimType: '병원 간병비', date: format(subDays(new Date(), 5), 'MM.dd', { locale: ko }) },
  { name: '안O연님', claimType: '가족 간병비', date: format(subDays(new Date(), 6), 'MM.dd', { locale: ko }) },
  { name: '백O민님', claimType: '병원 간병비', date: format(subDays(new Date(), 7), 'MM.dd', { locale: ko }) },
  { name: '문O서님', claimType: '가족 간병비', date: format(subDays(new Date(), 7), 'MM.dd', { locale: ko }) },
];


export default function RecentClaims() {
  const [claims] = useState<Claim[]>(staticClaims);

  // Duplicate the list for a seamless loop
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
