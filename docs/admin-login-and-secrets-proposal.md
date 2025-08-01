# 관리자 로그인 및 보안 비밀 관리 기능 구현 제안

이 문서는 K2의 검토를 돕기 위해, 현재 구현된 관리자 로그인 및 보안 비밀(API 키, 이메일 등) 관리 기능에 필요한 모든 코드 변경 사항을 하나의 파일로 정리한 것입니다.

**핵심 아키텍처:**
- **로컬 개발 환경:** `.env` 파일을 사용하여 모든 민감 정보를 관리합니다. 이를 통해 개발자는 실제 배포에 영향을 주지 않고 모든 기능을 자유롭게 테스트할 수 있습니다.
- **배포 환경:** `apphosting.yaml` 파일을 통해 Firebase Secret Manager를 사용합니다. 코드나 설정 파일에 실제 비밀번호나 API 키를 저장하지 않아 보안이 크게 강화됩니다.

---

## 1. 신규 파일: `src/middleware.ts`

로그인하지 않은 사용자가 `/admin` 경로에 접근하는 것을 막고, 로그인한 사용자가 `/login` 페이지에 접근하는 것을 막는 역할을 합니다.

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

서버에서 실제 로그인/로그아웃 로직을 처리하는 서버 액션입니다. `process.env`를 통해 현재 환경(로컬 또는 배포)에 맞는 환경 변수를 자동으로 읽어옵니다.

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
    
    // 로컬에서는 .env, 배포 환경에서는 Secret Manager의 값을 읽어옵니다.
    const adminUsername = process.env.CARECONNECT_ADMIN_USERNAME;
    const adminPassword = process.env.CARECONNECT_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials are not set in the environment variables.');
      return { error: '서버에 관리자 정보가 설정되지 않았습니다. 관리자에게 문의하세요.' };
    }

    if (username !== adminUsername || password !== adminPassword) {
      // Add a server-side log for easier debugging on the server.
      console.log(`Login attempt failed for user: ${username}. Credentials match: ${username === adminUsername}`);
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

## 5. 변경 파일: `apphosting.yaml`

배포 환경에서 사용할 모든 민감 정보를 **Firebase Secret Manager**를 통해 참조하도록 설정합니다. 이렇게 하면 실제 값은 코드 저장소(GitHub)에 노출되지 않습니다.

```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1

env:
  - variable: CARECONNECT_ADMIN_USERNAME
    secret: CARECONNECT_ADMIN_USERNAME
    availability:
      - RUNTIME

  - variable: CARECONNECT_ADMIN_PASSWORD
    secret: CARECONNECT_ADMIN_PASSWORD
    availability:
      - RUNTIME

  - variable: CARECONNECT_RESEND_API_KEY
    secret: CARECONNECT_RESEND_API_KEY
    availability:
      - RUNTIME

  - variable: CARECONNECT_EMAIL_FROM
    secret: CARECONNECT_EMAIL_FROM
    availability:
      - RUNTIME

  - variable: CARECONNECT_ADMIN_EMAIL_1
    secret: CARECONNECT_ADMIN_EMAIL_1
    availability:
      - RUNTIME
```

---

## 6. 파일: `.env` (또는 `.env.local`)

로컬 개발 환경에서만 사용하는 파일입니다. `git` 추적에서 제외되므로 민감 정보를 안전하게 테스트용으로 저장할 수 있습니다.

```
# 로컬 개발용 관리자 계정
CARECONNECT_ADMIN_USERNAME=admin
CARECONNECT_ADMIN_PASSWORD=password

# 로컬 개발용 Resend 이메일 설정
CARECONNECT_RESEND_API_KEY=re_12345678_abcdefgh
CARECONNECT_EMAIL_FROM=test@example.com
CARECONNECT_ADMIN_EMAIL_1=mytestemail@example.com
```

---

## 7. 관련 파일: `src/app/actions.ts` (이메일 발송 부분)

이메일 발송 로직이 어떻게 `process.env`를 통해 API 키와 이메일 주소를 읽어오는지 보여주는 예시입니다.

```ts
// ... (파일 상단 생략)

export async function submitCaregiverInquiry(data: z.infer<typeof CaregiverInquirySchema>) {
  try {
    // 로컬에서는 .env, 배포에서는 Secret Manager에서 값을 가져옴
    const resendApiKey = process.env.CARECONNECT_RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.length < 5) {
      return { success: false, message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' };
    }
    const resend = new Resend(resendApiKey);

    const adminEmails = await getAdminEmails(); // getAdminEmails 또한 process.env를 사용
    // ... (이하 로직 동일)

// ... (파일 하단 생략)
```
