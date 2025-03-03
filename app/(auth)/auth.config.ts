import type { NextAuthConfig } from 'next-auth';
import { appConfig } from '@/lib/config';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [],
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      // Skip auth check if not required
      if (!appConfig.auth.required) {
        return true;
      }

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL('/', nextUrl));
      }

      if (isOnRegister || isOnLogin) {
        return true;
      }

      if (isOnChat) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
