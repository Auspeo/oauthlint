import jwt from 'jsonwebtoken';

// ok: auth.jwt.weak-secret
export const token = jwt.sign({ uid: 1 }, process.env.JWT_SECRET!);

// ok: auth.jwt.weak-secret
export function verifyGood(t: string) {
  return jwt.verify(t, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}
