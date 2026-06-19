import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.long-lived
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 31_536_000_000, // 1 year
  });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.long-lived
  res.cookie('refresh_token', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7776000000,
  });
}
