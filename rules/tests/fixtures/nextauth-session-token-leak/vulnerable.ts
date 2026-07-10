import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
      // ruleid: auth.nextauth.session-token-leak
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

export const { handlers } = NextAuth({
  providers: [],
  callbacks: {
    session: ({ session, token }) => {
      // ruleid: auth.nextauth.session-token-leak
      session.user.refreshToken = token.refresh_token;
      return session;
    },
  },
});
