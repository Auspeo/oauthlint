import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-samesite
  res.cookie('session', token, { httpOnly: true, secure: true });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-samesite
  res.cookie('refresh_token', jwt, { httpOnly: true });
}

export function loginBad3(res: Response, token: string) {
  // ruleid: auth.cookie.no-samesite -- SameSite=None without Secure
  res.cookie('session', token, { httpOnly: true, sameSite: 'none' });
}
