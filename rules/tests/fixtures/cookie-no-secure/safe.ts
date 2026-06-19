import type { Response } from 'express';

// ok: auth.cookie.no-secure
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}

// ok: auth.cookie.no-secure -- "preferences" is not an auth cookie
export function setPrefs(res: Response, value: string) {
  res.cookie('preferences', value, { httpOnly: false });
}
