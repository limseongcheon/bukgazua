import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');

  // If the user is trying to access any admin page and there's no session cookie,
  // redirect them to the login page.
  if (!sessionCookie) {
    // '/login' 페이지 자체로의 접근은 허용해야 무한 리다이렉션을 피할 수 있습니다.
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }
  }

  // If there is a session cookie, let them proceed.
  // In a real app, you'd want to verify the session token here.
  return NextResponse.next();
}

// matcher를 수정하여 /admin 경로에만 미들웨어가 적용되도록 합니다.
export const config = {
  matcher: '/admin/:path*',
};
