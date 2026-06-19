import type { Response } from 'express';

// ok: auth.cookie.no-httponly
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}
