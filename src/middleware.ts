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
