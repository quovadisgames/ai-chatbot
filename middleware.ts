import { NextResponse } from 'next/server';
import { appConfig } from '@/lib/config';

export async function middleware(request: Request) {
  const pathname = new URL(request.url).pathname;

  // If auth is not required, allow access
  if (!appConfig.auth.required) {
    return NextResponse.next();
  }

  // Always check auth for protected pages
  if (appConfig.auth.protectedPages.includes(pathname)) {
    const session = await fetch('/api/auth/session');
    if (!session.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
