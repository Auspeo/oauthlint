import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  // ok: auth.nextauth.trust-host-enabled -- gated on an environment variable
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
};

export const { handlers } = NextAuth({
  providers: [],
  // ok: auth.nextauth.trust-host-enabled -- left unset, relies on auto-detection
});

// ok: auth.nextauth.trust-host-enabled -- unrelated options object
const proxyOptions = {
  trustHost: true,
};
