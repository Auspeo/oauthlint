import jwt from 'jsonwebtoken';

// ok: auth.jwt.no-expiration
export const accessToken = jwt.sign({ uid: 1 }, process.env.JWT_SECRET!, {
  expiresIn: '15m',
});

// ok: auth.jwt.no-expiration
export const refreshToken = jwt.sign(
  { uid: 1, exp: Math.floor(Date.now() / 1000) + 3600 },
  process.env.JWT_SECRET!,
);

// ok: auth.jwt.no-expiration -- exp in payload with an options object (3-arg form)
export const withExpAndOpts = jwt.sign(
  { uid: 1, exp: Math.floor(Date.now() / 1000) + 3600 },
  process.env.JWT_SECRET!,
  { algorithm: 'HS256' },
);
