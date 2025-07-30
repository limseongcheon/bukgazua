# 스타일 디버깅 리포트 (K2 전달용)

이 파일은 Next.js + Tailwind CSS 프로젝트에서 발생하는 '배포 시 스타일 깨짐' 현상의 원인 분석을 위해 모든 스타일 관련 코드를 정리한 것입니다.

## 1. package.json (의존성)

스타일 및 빌드와 관련된 라이브러리 목록입니다.

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.13.0",
    "@genkit-ai/next": "^1.13.0",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "better-sqlite3": "^11.1.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "firebase": "^11.9.1",
    "genkit": "^1.13.0",
    "lucide-react": "^0.475.0",
    "next": "15.3.3",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "resend": "^3.2.0",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "genkit-cli": "^1.13.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---

## 2. tailwind.config.ts (Tailwind 설정)

폰트, 색상, 애니메이션 등 Tailwind CSS의 핵심 설정 파일입니다. 빌드 시 Purge(스타일 트리 쉐이킹) 동작에 직접적인 영향을 줍니다.

```ts
import type {Config} from 'tailwindcss';
import {fontFamily} from 'tailwindcss/defaultTheme';

const config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        headline: ['var(--font-headline)', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        claim: {
          DEFAULT: 'hsl(var(--claim-bg))',
          foreground: 'hsl(var(--claim-fg))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
        'marquee-normal': {
          '0%': {transform: 'translateX(0)'},
          '100%': {transform: 'translateX(-50%)'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'marquee-normal': 'marquee-normal 160s linear infinite',
        pause: 'running paused',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
```

---

## 3. src/app/globals.css (전역 스타일)

CSS 변수(테마 색상)와 Tailwind의 기본 레이어를 정의하는 파일입니다.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 83% 98%;
    --foreground: 222 47% 11%;
    --card: 222 83% 98%;
    --card-foreground: 222 47% 11%;
    --popover: 222 83% 98%;
    --popover-foreground: 222 47% 11%;
    --primary: 0 84.2% 68.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 220 15% 90%;
    --secondary-foreground: 220 15% 30%;
    --muted: 220 15% 96%;
    --muted-foreground: 222 47% 44%;
    --accent: 210 90% 63%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 220 13% 88%;
    --input: 220 13% 88%;
    --ring: 222 47% 11%;
    --radius: 0.5rem;

    /* Custom Claim Theme */
    --claim-bg: 145 75% 92%;
    --claim-fg: 145 60% 25%;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 222 47% 11%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 11%;
    --popover-foreground: 210 40% 98%;
    --primary: 0 84.2% 68.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 220 15% 20%;
    --secondary-foreground: 210 40% 98%;
    --muted: 220 15% 20%;
    --muted-foreground: 220 15% 65%;
    --accent: 210 90% 63%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 220 15% 30%;
    --input: 220 15% 30%;
    --ring: 210 40% 98%;

    /* Custom Claim Theme */
    --claim-bg: 145 50% 25%;
    --claim-fg: 145 30% 90%;
  }

  .support-theme {
    --primary: 145 63% 40%;
    --primary-foreground: 0 0% 98%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply scroll-smooth;
  }
}
```

---

## 4. src/app/layout.tsx (폰트 적용)

Google Fonts를 불러와 `<body>` 태그에 적용하는 부분입니다.

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { PT_Sans, Gowun_Dodum } from 'next/font/google';
import { cn } from '@/lib/utils';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

const gowunDodum = Gowun_Dodum({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: "천사손길",
  description: '당신에게 꼭 맞는 간병인을 찾아보세요.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn("antialiased", ptSans.variable, gowunDodum.variable)}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

---

## 5. src/components/layout/header.tsx (문제가 된 컴포넌트)

빌드 시 스타일이 깨지는 현상이 이 컴포넌트의 버튼 생성 방식과 관련이 있을 가능성이 높습니다.

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/layout/app-logo';

export default function Header() {
  const navItems = [
    { href: '/#services', label: '서비스' },
    { href: '/#find-caregiver', label: '간병인 찾기' },
    { href: '/insurance-claim', label: '보험서류 청구' },
    { href: '/inquiry', label: '일반 문의' },
    { href: '/support', label: '간병인 지원' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <AppLogo className="mr-auto" />
        
        <nav className="hidden md:flex items-center gap-1">
           <Button asChild variant="outline" className="border-accent text-foreground hover:bg-accent hover:text-accent-foreground">
              <Link href="/#services">서비스</Link>
            </Button>
            <Button asChild variant="outline" className="border-accent text-foreground hover:bg-accent hover:text-accent-foreground">
              <Link href="/#find-caregiver">간병인 찾기</Link>
            </Button>
            <Button asChild variant="outline" className="border-accent text-foreground hover:bg-accent hover:text-accent-foreground">
              <Link href="/insurance-claim">보험서류 청구</Link>
            </Button>
            <Button asChild variant="outline" className="border-accent text-foreground hover:bg-accent hover:text-accent-foreground">
              <Link href="/inquiry">일반 문의</Link>
            </Button>
            <Button asChild variant="outline" className="border-destructive text-black hover:bg-destructive hover:text-destructive-foreground">
              <Link href="/support">간병인 지원</Link>
            </Button>
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">네비게이션 메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetClose asChild>
                   <AppLogo />
                </SheetClose>
                 <SheetTitle className="sr-only">메인 메뉴</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium mt-6">
                {navItems.map((item) => {
                  return (
                    <SheetClose asChild key={item.href + item.label}>
                      <Link href={item.href} className="flex items-center justify-center rounded-md border p-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

---

## 6. src/components/sections/recent-claims.tsx (Hydration 오류 의심)

동적으로 날짜/이름을 생성하는 로직이 서버와 클라이언트 간 렌더링 불일치(Hydration Mismatch)를 유발하여 스타일 깨짐의 원인이 될 수 있습니다.

```tsx
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
    claims.push({ name: `${'${'}name}님`, claimType, date });
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
```
