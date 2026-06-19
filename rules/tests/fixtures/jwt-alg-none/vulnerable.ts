// ruleid: auth.jwt.alg-none
import jwt from 'jsonwebtoken';

export function badVerify(token: string) {
  return jwt.verify(token, 'k', { algorithms: ['RS256', 'none'] });
}

// ruleid: auth.jwt.alg-none
export function badVerify2(token: string) {
  return jwt.verify(token, 'k', { algorithms: ['none'] });
}
