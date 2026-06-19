import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-secure
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-secure
  res.cookie('auth_token', jwt);
}

export function loginBad3(res: Response, token: string) {
  // ruleid: auth.cookie.no-secure -- secure explicitly disabled
  res.cookie('session', token, { httpOnly: true, secure: false });
}
