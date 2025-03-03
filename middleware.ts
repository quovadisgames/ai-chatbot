import NextAuth from 'next-auth';
import { appConfig } from '@/lib/config';
import { auth } from '@/app/(auth)/auth';

export default async function middleware(request: Request) {
  // If auth is not required, skip authentication check
  if (!appConfig.auth.required) {
    return NextAuth(auth).auth(request);
  }

  const pathname = new URL(request.url).pathname;
  
  // Always check auth for protected pages even if auth is not required
  if (appConfig.auth.protectedPages.includes(pathname)) {
    return NextAuth(auth).auth(request);
  }

  // For other routes, skip auth when not required
  return NextAuth(auth).auth(request);
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
