import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-expiration
export const noExp = jwt.sign({ uid: 1 }, process.env.JWT_SECRET!);

// ruleid: auth.jwt.no-expiration
export const noExp2 = jwt.sign({ uid: 2, role: 'admin' }, process.env.JWT_SECRET!, {
  algorithm: 'HS256',
});
