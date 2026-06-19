import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-issuer
export function verifyBad(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
    algorithms: ['RS256'],
    audience: 'example-api',
  });
}

// ruleid: auth.jwt.no-issuer -- 2-arg verify has no options, so no issuer check
export function verifyBad2(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
