import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-httponly
  res.cookie('session', token, { secure: true, sameSite: 'lax' });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-httponly
  res.cookie('auth_token', jwt, { secure: true });
}

export function loginBad3(res: Response, token: string) {
  // ruleid: auth.cookie.no-httponly -- httpOnly explicitly disabled
  res.cookie('session', token, { secure: true, httpOnly: false });
}

export function loginBad4(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-httponly -- 2-arg form, no options at all
  res.cookie('session_id', jwt);
}
