import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    // ok: auth.nextauth.session-token-leak -- only non-sensitive fields on the session
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      return session;
    },
  },
};

export const { handlers } = NextAuth({
  providers: [],
  callbacks: {
    // ok: auth.nextauth.session-token-leak -- token kept in the JWT, not exposed
    async jwt({ token, account }) {
      if (account) token.accessToken = account.access_token;
      return token;
    },
  },
});
