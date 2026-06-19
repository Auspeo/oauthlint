import type { Response } from 'express';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.long-lived
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: ONE_YEAR_MS,
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
