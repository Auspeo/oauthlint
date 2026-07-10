import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // ruleid: auth.nextauth.cookie-insecure
        secure: false,
      },
    },
  },
};

export const { handlers } = NextAuth({
  providers: [],
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        // ruleid: auth.nextauth.cookie-insecure
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
});
