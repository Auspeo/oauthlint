import type { Response } from 'express';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ok: auth.cookie.long-lived
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: FIFTEEN_MIN_MS,
  });
}

// ok: auth.cookie.long-lived -- still under 30 days
export function rememberMeOk(res: Response, refresh: string) {
  res.cookie('refresh_token', refresh, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: ONE_WEEK_MS,
  });
}
