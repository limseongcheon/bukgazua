# 관리자 로그인 기능 구현 제안 (.env 및 apphosting.yaml 방식)

이 문서는 K2의 검토를 돕기 위해, Firebase App Hosting 배포 환경과 로컬 개발 환경 모두를 고려한 관리자 로그인 기능 구현에 필요한 모든 코드 변경 사항을 하나의 파일로 정리한 것입니다.

**핵심 변경 사항:**
-   로그인/로그아웃 기능 추가
-   미들웨어를 사용하여 `/admin` 경로를 보호
-   **로컬 개발용:** `.env.local` 파일을 사용하여 아이디/비밀번호 관리
-   **배포 환경용:** `apphosting.yaml`에 환경 변수를 직접 명시하여 보안 강화

---

## 1. 신규 파일: `src/middleware.ts`

로그인하지 않은 사용자가 `/admin` 페이지에 접근하는 것을 막고, 로그인한 사용자가 `/login` 페이지에 가는 것을 막는 역할을 합니다.

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // If the user is trying to access the admin page without a session,
  // redirect them to the login page.
  if (request.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is logged in and tries to access the login page,
  // redirect them to the admin page.
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// Ensure the middleware runs only on specific paths.
export const config = {
  matcher: ['/admin/:path*', '/login'],
};
```

---

## 2. 신규 파일: `src/app/login/page.tsx`

로그인 폼을 보여주는 페이지입니다.

```tsx
import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12 bg-secondary">
      <LoginForm />
    </div>
  );
}
```

---

## 3. 신규 파일: `src/components/login-form.tsx`

실제 로그인 UI와 클라이언트 로직을 담당하는 리액트 컴포넌트입니다.

```tsx
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/login/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '로그인'}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>관리자 로그인</CardTitle>
        <CardDescription>계속하려면 자격 증명을 입력하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">아이디</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full px-3"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## 4. 신규 파일: `src/app/login/actions.ts`

서버에서 실제 로그인 로직을 처리하는 서버 액션입니다. `process.env`를 통해 환경 변수를 읽습니다.

```ts
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
    
    // 로컬에서는 .env.local, 배포 환경에서는 apphosting.yaml의 값을 읽어옵니다.
    const adminUsername = process.env.CARECONNECT_ADMIN_USERNAME;
    const adminPassword = process.env.CARECONNECT_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials are not set in the environment variables.');
      return { error: '서버에 관리자 정보가 설정되지 않았습니다. 관리자에게 문의하세요.' };
    }

    if (username !== adminUsername || password !== adminPassword) {
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
    return { error: '로그인 중 알 수 없는 오류가 발생했습니다.' };
  }
  
  // 로그인 성공 시 /admin 페이지로 리디렉션
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
```

---

## 5. 신규 파일: `src/components/admin/logout-button.tsx`

관리자 페이지에 추가될 로그아웃 버튼 컴포넌트입니다.

```tsx
'use client';

import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </Button>
    </form>
  );
}
```

---

## 6. 변경 파일: `src/app/layout.tsx`

`<body>` 태그에 flex 스타일을 추가하여 푸터가 항상 페이지 하단에 고정되도록 수정합니다.

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
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
      <body className={cn("flex flex-col min-h-screen antialiased font-sans", ptSans.variable)}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
```

---

## 7. 신규 파일: `.env.local`

로컬 개발 환경에서만 사용할 임시 아이디/비밀번호 파일입니다. **이 파일은 `.gitignore`에 의해 GitHub에 올라가지 않습니다.**

```
CARECONNECT_ADMIN_USERNAME=admin
CARECONNECT_ADMIN_PASSWORD=password
```

---

## 8. 변경 파일: `apphosting.yaml`

배포 환경에서 사용할 실제 아이디/비밀번호를 설정합니다. (K2의 제안 반영)

```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1

env:
  - variable: CARECONNECT_ADMIN_USERNAME
    value: "admin"
    availability:
      - RUNTIME

  - variable: CARECONNECT_ADMIN_PASSWORD
    value: "password"
    availability:
      - RUNTIME
```
