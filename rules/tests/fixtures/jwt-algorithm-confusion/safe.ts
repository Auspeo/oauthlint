import jwt from 'jsonwebtoken';

const RSA_PUBLIC = process.env.JWT_PUBLIC_KEY!;
const HMAC_SECRET = process.env.JWT_HMAC_SECRET!;

// ok: auth.jwt.algorithm-confusion -- RS256 matches the asymmetric key
export function goodVerifyAsymmetric(token: string) {
  return jwt.verify(token, RSA_PUBLIC, { algorithms: ['RS256'] });
}

// ok: auth.jwt.algorithm-confusion -- HS256 with a real shared secret, not a PEM
export function goodVerifySymmetric(token: string) {
  return jwt.verify(token, HMAC_SECRET, { algorithms: ['HS256'] });
}
