import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all paths except static files, api routes, and index.html
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|index.html|styles|themes|assets|public|avatars).*)',
  ],
};
