import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { appConfig } from '@/lib/config';
import { authConfig } from '@/app/(auth)/auth.config';
import NextAuth from 'next-auth';

export default async function middleware(request: NextRequest) {
  // If auth is not required, allow access
  if (!appConfig.auth.required) {
    return NextResponse.next();
  }

  const pathname = new URL(request.url).pathname;

  // Always check auth for protected pages
  if (appConfig.auth.protectedPages.includes(pathname)) {
    const auth = await NextAuth(authConfig);
    const session = await auth.auth(request);
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
