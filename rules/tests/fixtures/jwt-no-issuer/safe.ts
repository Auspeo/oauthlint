import jwt from 'jsonwebtoken';

// ok: auth.jwt.no-issuer
export function verifyGood(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
    algorithms: ['RS256'],
    audience: 'example-api',
    issuer: 'https://idp.oauthlint.dev',
  });
}
