import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-audience
export function verifyBad(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}

// ruleid: auth.jwt.no-audience
export function verifyBad2(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!);
}
