import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';

// ruleid: auth.nextauth.hardcoded-secret
const { handlers } = NextAuth({
  providers: [Credentials({})],
  secret: 'sk_live_8f3kd92jfh38dPq0aabbccddeeff',
});

// ruleid: auth.nextauth.hardcoded-secret
export const authOptions = {
  providers: [Credentials({})],
  secret: 'hunter2-super-secret-signing-key-zzzz',
};

// ruleid: auth.nextauth.hardcoded-secret
const authConfig: NextAuthConfig = {
  providers: [],
  secret: 'aGVsbG8td29ybGQtc2lnbmluZy1zZWNyZXQ=',
};

// ruleid: auth.nextauth.hardcoded-secret
export default NextAuth(req, res, {
  providers: [],
  secret: 'pages-router-hardcoded-secret-value-9',
});
