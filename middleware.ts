import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';


export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/api/auth'
  ];
  
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path + '/')
  );

  // Allow access to public assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/images') ||
    request.nextUrl.pathname.startsWith('/styles') ||
    request.nextUrl.pathname.startsWith('/themes') ||
    request.nextUrl.pathname.startsWith('/assets') ||
    request.nextUrl.pathname.startsWith('/avatars')
  ) {
    return NextResponse.next();
  }

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, check if user has a session cookie
  const hasSessionCookie = request.cookies.has('next-auth.session-token');
  
  // If not authenticated and trying to access a protected route, redirect to login
  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}


export const config = {
  // Apply middleware to all routes except for static files and API routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)' 
  ],
};
