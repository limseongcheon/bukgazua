import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  // 사용자가 '/admin'으로 시작하는 경로에 접근하려고 하고, 세션 쿠키가 없는 경우,
  // 로그인 페이지로 리디렉션합니다.
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    // 원래 가려던 경로를 'from' 쿼리 파라미터로 추가하여 로그인 후 돌아갈 수 있도록 합니다.
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 세션 쿠키가 있는 경우, 요청을 그대로 진행합니다.
  // 실제 앱에서는 여기서 세션 토큰의 유효성을 검증해야 합니다.
  return NextResponse.next();
}

// 미들웨어가 적용될 경로를 명시적으로 지정합니다.
// '/admin'과 그 하위 모든 경로에만 이 미들웨어가 실행됩니다.
export const config = {
  matcher: '/admin/:path*',
};
