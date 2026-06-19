import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-samesite
  res.cookie('session', token, { httpOnly: true, secure: true });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-samesite
  res.cookie('refresh_token', jwt, { httpOnly: true });
}
