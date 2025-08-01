# 관리자 로그인 기능 구현 제안 (.env 방식)

이 문서는 K2의 검토를 돕기 위해, `.env` 파일을 사용하는 관리자 로그인 기능 구현에 필요한 모든 코드 변경 사항을 하나의 파일로 정리한 것입니다.

**핵심 변경 사항:**
-   `.env` 파일을 사용하여 로컬 개발 환경의 인증 정보 관리
-   로그인/로그아웃 기능 추가
-   미들웨어를 사용하여 `/admin` 경로를 보호

---

## 1. 신규 파일: `.env`

**주의:** 이 파일은 민감 정보를 포함하므로, Git에 커밋되지 않도록 `.gitignore`에 반드시 포함되어야 합니다. (Next.js 기본 설정에 이미 포함되어 있습니다.)

```
CARECONNECT_ADMIN_USERNAME=admin
CARECONNECT_ADMIN_PASSWORD=password

# 이메일 발송을 위한 Resend API 키 (선택 사항)
# CARECONNECT_RESEND_API_KEY=re_xxxxxxxxxxxx
# 관리자에게 발송될 이메일의 "From" 주소 (Resend 샌드박스 모드에서는 가입 시 인증한 이메일 주소여야 함)
# CARECONNECT_EMAIL_FROM=onboarding@resend.dev

# 관리자 이메일 주소 (최대 5개)
# CARECONNECT_ADMIN_EMAIL_1=your-email@example.com
```

---

## 2. 신규 파일: `src/middleware.ts`

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

## 3. 신규 파일: `src/app/login/page.tsx`

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

## 4. 신규 파일: `src/components/login-form.tsx`

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

## 5. 신규 파일: `src/app/login/actions.ts`

서버에서 실제 로그인 로직을 처리하는 서버 액션입니다. `.env` 파일의 값을 읽어옵니다.

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
    
    // .env 파일에 저장된 값을 읽어옵니다.
    const adminUsername = process.env.CARECONNECT_ADMIN_USERNAME;
    const adminPassword = process.env.CARECONNECT_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials are not set in the .env file.');
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
  
  // 로그인 성공 시 /admin 페이지로 리디렉션 (try/catch 블록 밖에서 호출)
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

## 6. 신규 파일: `src/components/admin/logout-button.tsx`

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

## 7. 변경 파일: `src/app/admin/page.tsx`

기존 관리자 페이지에 로그아웃 버튼을 추가합니다.

```tsx
'use client';

import { useEffect, useState, useMemo, useRef, FormEvent, useCallback } from 'react';
import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Caregiver } from '@/types/caregiver-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';

// Import the new LogoutButton
import LogoutButton from '@/components/admin/logout-button';
import CaregiverForm from '@/components/admin/caregiver-form';
import CaregiverTable from '@/components/admin/caregiver-table';
import EditCaregiverDialog from '@/components/admin/edit-caregiver-dialog';

// Main AdminPage Component
export default function AdminPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("register");
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);

  useEffect(() => {
    const fetchCaregivers = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/caregivers');
          const data = await response.json();
          if(!response.ok) {
              throw new Error(data.error || '간병인 목록을 불러오지 못했습니다.')
          }
          const sortedData = (data || []).sort((a: Caregiver, b: Caregiver) => (b.id || 0) - (a.id || 0));
          setCaregivers(sortedData);
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: '오류',
            description: error.message || '간병인 목록을 불러오지 못했습니다.',
          });
          setCaregivers([]);
        } finally {
          setIsLoading(false);
        }
    };
    fetchCaregivers();
  }, [toast]);

  const filteredCaregivers = useMemo(() => {
    if (!searchTerm) return caregivers;
    return caregivers.filter(caregiver =>
      caregiver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [caregivers, searchTerm]);

  const handleAddSuccess = useCallback((newCaregiver: Caregiver) => {
    setCaregivers((prev) => [newCaregiver, ...prev].sort((a,b) => (b.id || 0) - (a.id || 0)));
    setActiveTab("manage");
  }, []);

  const handleEditSuccess = useCallback((updatedCaregiver: Caregiver) => {
    setCaregivers(prev => prev.map(c => c.id === updatedCaregiver.id ? updatedCaregiver : c));
    setEditingCaregiver(null);
  }, []);

  const handleDeleteSuccess = useCallback((deletedIds: number[]) => {
      setCaregivers(prev => prev.filter(c => !deletedIds.includes(c.id)));
  }, []);

  const handleSelectAllRows = useCallback((checked: boolean | string) => {
    setSelectedRowIds(checked ? filteredCaregivers.map(c => c.id) : []);
  }, [filteredCaregivers]);

  const handleSelectRow = useCallback((id: number, checked: boolean | string) => {
      setSelectedRowIds(prev => checked ? [...prev, id] : prev.filter(rowId => rowId !== id));
  }, []);

  const handleDeleteSelectedRows = useCallback(async () => {
      setIsDeleting(true);
      try {
          const response = await fetch('/api/caregivers', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: selectedRowIds }),
          });
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || '삭제 중 오류가 발생했습니다.');
          }
          toast({
              title: "성공",
              description: `${result.count}명의 간병인이 삭제되었습니다.`
          });
          handleDeleteSuccess(selectedRowIds);
          setSelectedRowIds([]);
      } catch (err: any) {
           toast({
              variant: 'destructive',
              title: '오류',
              description: err.message,
          });
      } finally {
          setIsDeleting(false);
      }
  }, [selectedRowIds, handleDeleteSuccess, toast]);
  
  const handleEditRequest = useCallback((caregiver: Caregiver) => {
    setEditingCaregiver(caregiver);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCaregiver(null);
  }, []);

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">관리자 페이지</h1>
          <p className="text-muted-foreground mt-2">간병인 정보를 등록하고 관리합니다.</p>
        </div>
        <LogoutButton />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">새 간병인 등록</TabsTrigger>
          <TabsTrigger value="manage">간병인 관리</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-6">
            <CaregiverForm onSuccess={handleAddSuccess} />
        </TabsContent>
        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>등록된 간병인 목록</CardTitle>
              <div className="flex justify-between items-center gap-4 pt-2">
                <CardDescription>{caregivers.length}명의 간병인이 등록되어 있습니다.</CardDescription>
                <div className="relative w-full max-w-xs">
                  <Input 
                    placeholder="이름으로 검색..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CaregiverTable 
                    caregivers={filteredCaregivers} 
                    selectedRowIds={selectedRowIds}
                    isDeleting={isDeleting}
                    onSelectAll={handleSelectAllRows}
                    onSelectRow={handleSelectRow}
                    onDeleteSelected={handleDeleteSelectedRows}
                    onEditSuccess={handleEditSuccess} 
                    onEditRequest={handleEditRequest}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={!!editingCaregiver} onOpenChange={(open) => !open && handleCancelEdit()}>
        {editingCaregiver && (
           <EditCaregiverDialog 
              caregiver={editingCaregiver} 
              onEditSuccess={handleEditSuccess}
              onCancel={handleCancelEdit}
           />
        )}
      </Dialog>
    </div>
  );
}
```

---

## 8. 변경 파일: `src/app/layout.tsx`

`<body>` 태그에 flex 스타일을 추가하여 푸터가 항상 페이지 하단에 고정되도록 수정합니다. (로그인 페이지의 레이아웃이 깨지지 않도록 하기 위함)

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