import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  // ok: auth.nextauth.debug-enabled -- gated on the environment, off in production
  debug: process.env.NODE_ENV !== 'production',
};

export const { handlers } = NextAuth({
  providers: [],
  // ok: auth.nextauth.debug-enabled -- left unset, defaults to off
});

// ok: auth.nextauth.debug-enabled -- unrelated options object, not a NextAuth config
const buildOptions = {
  debug: true,
};
