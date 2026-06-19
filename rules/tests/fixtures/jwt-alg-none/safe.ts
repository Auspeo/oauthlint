import jwt from 'jsonwebtoken';

// ok: auth.jwt.alg-none
export function goodVerify(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}
