'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { toast } = useToast();
  
  // 초기 상태를 명확하게 정의합니다.
  const [state, formAction] = useActionState(login, { success: false, message: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // 액션 결과에 따라 토스트를 보여주거나 페이지를 이동합니다.
    if (state.message) {
      if (state.success) {
        toast({
          title: '로그인 성공',
          description: '관리자 페이지로 이동합니다.',
        });
        // 로그인 성공 시 클라이언트 측에서 페이지 이동
        router.push('/admin');
      } else {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: state.message,
        });
      }
    }
  }, [state, router, toast]);

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
