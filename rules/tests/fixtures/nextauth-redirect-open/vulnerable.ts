import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    // ruleid: auth.nextauth.redirect-open
    async redirect({ url, baseUrl }) {
      return url;
    },
  },
};

export const { handlers } = NextAuth({
  providers: [],
  callbacks: {
    // ruleid: auth.nextauth.redirect-open
    redirect: ({ url, baseUrl }) => url,
  },
});

export const authOptions = {
  providers: [],
  callbacks: {
    // ruleid: auth.nextauth.redirect-open
    redirect: async ({ url }) => {
      return url;
    },
  },
};
