import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  // 세션 쿠키가 없으면 로그인 페이지로 리디렉션합니다.
  // 이 미들웨어는 아래 config에 의해 '/admin' 경로에만 적용됩니다.
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    // 원래 가려던 경로를 'from' 쿼리 파라미터로 추가합니다.
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 세션 쿠키가 있으면 요청을 그대로 진행합니다.
  return NextResponse.next();
}

// 미들웨어가 적용될 경로를 명시적으로 지정합니다.
// '/admin'과 그 하위 모든 경로에만 이 미들웨어가 실행됩니다.
export const config = {
  matcher: '/admin/:path*',
};
