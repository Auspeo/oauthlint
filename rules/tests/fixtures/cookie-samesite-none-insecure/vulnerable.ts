import type { Response } from 'express';

export function loginBad(res: Response, v: string) {
  // ruleid: auth.cookie.samesite-none-insecure
  res.cookie('sid', v, { httpOnly: true, sameSite: 'none' });
}

export function loginBad2(res: Response, v: string) {
  // ruleid: auth.cookie.samesite-none-insecure
  res.cookie('sid', v, { httpOnly: true, sameSite: 'None', secure: false });
}

export function loginBad3(res: Response, v: string) {
  // ruleid: auth.cookie.samesite-none-insecure
  const opts = { sameSite: 'none', path: '/' };
  res.cookie('sid', v, opts);
}

export function setCookieHeader(res: Response, v: string) {
  // ruleid: auth.cookie.samesite-none-insecure
  res.setHeader('Set-Cookie', `sid=${v}; HttpOnly; SameSite=None`);
}
