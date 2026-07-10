import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    // ruleid: auth.nextauth.authorized-always-true
    authorized({ auth }) {
      return true;
    },
  },
};

export const { auth } = NextAuth({
  providers: [],
  callbacks: {
    // ruleid: auth.nextauth.authorized-always-true
    authorized: ({ auth }) => true,
  },
});

export const authOptions = {
  providers: [],
  callbacks: {
    // ruleid: auth.nextauth.authorized-always-true
    authorized: async ({ request, auth }) => {
      return true;
    },
  },
};
