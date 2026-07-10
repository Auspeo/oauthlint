import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    // ok: auth.nextauth.redirect-open -- validates the url against baseUrl first
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

export const { handlers } = NextAuth({
  providers: [],
  callbacks: {
    // ok: auth.nextauth.redirect-open -- only ever returns a local path
    redirect: ({ url, baseUrl }) => (url.startsWith(baseUrl) ? url : baseUrl),
  },
});

// ok: auth.nextauth.redirect-open -- an unrelated helper, not a NextAuth callback
const router = {
  redirect: ({ url }: { url: string }) => url,
};
