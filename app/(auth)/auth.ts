import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

// Enable mock authentication for development
const USE_MOCK_AUTH = true;

interface ExtendedSession extends Session {
  user: User;
}

// Mock user for development
const MOCK_USER = {
  id: "mock-user-123",
  name: "Development User",
  email: "dev@example.com",
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        // Use mock authentication if enabled
        if (USE_MOCK_AUTH) {
          console.log("Using mock authentication");
          return MOCK_USER as any;
        }
        
        // Regular authentication flow
        try {
          const users = await getUser(email);
          if (users.length === 0) return null;
          // biome-ignore lint: Forbidden non-null assertion.
          const passwordsMatch = await compare(password, users[0].password!);
          if (!passwordsMatch) return null;
          return users[0] as any;
        } catch (error) {
          console.error("Authentication error:", error);
          // Return mock user as fallback if database connection fails
          if (USE_MOCK_AUTH) {
            console.log("Database connection failed, using mock user");
            return MOCK_USER as any;
          }
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
