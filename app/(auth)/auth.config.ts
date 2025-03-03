import type { NextAuthConfig } from 'next-auth';
import { appConfig } from '@/lib/config';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      
      // Skip auth check if not required
      if (!appConfig.auth.required) {
        return true;
      }

      if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
        return Response.redirect(new URL('/', request.nextUrl));
      }

      if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        return true;
      }

      return isLoggedIn;
    },
  },
};
