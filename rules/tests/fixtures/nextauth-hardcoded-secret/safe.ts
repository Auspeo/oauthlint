import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';

// ok: auth.nextauth.hardcoded-secret -- read from the environment
const { handlers } = NextAuth({
  providers: [Credentials({})],
  secret: process.env.AUTH_SECRET,
});

// ok: auth.nextauth.hardcoded-secret -- legacy env var name, still safe
export const authOptions = {
  providers: [Credentials({})],
  secret: process.env.NEXTAUTH_SECRET,
};

// ok: auth.nextauth.hardcoded-secret -- documentation placeholder, not a real leak
const authConfig: NextAuthConfig = {
  providers: [],
  secret: 'your-auth-secret-here',
};

// ok: auth.nextauth.hardcoded-secret -- unrelated object, not a NextAuth config
const telemetry = {
  secret: 'this-is-not-an-auth-config-at-all',
};
