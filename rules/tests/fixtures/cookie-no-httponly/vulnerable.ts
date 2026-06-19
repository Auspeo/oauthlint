import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-httponly
  res.cookie('session', token, { secure: true, sameSite: 'lax' });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-httponly
  res.cookie('auth_token', jwt, { secure: true });
}
