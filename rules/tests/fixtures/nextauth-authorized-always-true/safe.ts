import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    // ok: auth.nextauth.authorized-always-true -- checks the session
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};

export const { auth } = NextAuth({
  providers: [],
  callbacks: {
    // ok: auth.nextauth.authorized-always-true -- gates public vs protected routes
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      if (request.nextUrl.pathname.startsWith('/dashboard')) return isLoggedIn;
      return true;
    },
  },
});

// ok: auth.nextauth.authorized-always-true -- unrelated object, not a NextAuth config
const acl = {
  callbacks: {
    authorized: () => true,
  },
};
