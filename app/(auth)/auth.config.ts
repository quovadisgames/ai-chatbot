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

      const isOnChat = pathname.startsWith('/');
      const isOnRegister = pathname.startsWith('/register');
      const isOnLogin = pathname.startsWith('/login');

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL('/', request.nextUrl));
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
};
