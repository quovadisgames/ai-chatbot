import NextAuth, { type User, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: {},
      async authorize(credentials: any) {
        try {
          const response = await fetch('/api/auth/verify-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) return null;
          return await response.json();
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
