import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { appConfig } from '@/lib/config';

export default async function middleware(request: NextRequest) {
  // If auth is not required, allow access
  if (!appConfig.auth.required) {
    return NextResponse.next();
  }

  const pathname = new URL(request.url).pathname;

  // Always check auth for protected pages
  if (appConfig.auth.protectedPages.includes(pathname)) {
    // Check session via API route
    const response = await fetch(new URL('/api/auth/session', request.url));
    const session = await response.json();

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
