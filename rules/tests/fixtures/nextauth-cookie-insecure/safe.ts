import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      // ok: auth.nextauth.cookie-insecure -- secure and httpOnly are both on
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
};

// ok: auth.nextauth.cookie-insecure -- unrelated cookie config, not a NextAuth options object
const analyticsCookie = {
  name: 'analytics',
  secure: false,
  httpOnly: false,
};
