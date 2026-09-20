import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://auth.example.com/.well-known/jwks.json'));

export async function verify(token: string) {
  // ruleid: auth.jwt.jose-no-audience
  const { payload } = await jwtVerify(token, JWKS, { issuer: 'https://auth.example.com' });
  return payload;
}
