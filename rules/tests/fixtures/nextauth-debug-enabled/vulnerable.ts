import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  // ruleid: auth.nextauth.debug-enabled
  debug: true,
};

export const { handlers } = NextAuth({
  providers: [],
  // ruleid: auth.nextauth.debug-enabled
  debug: true,
});
