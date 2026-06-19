import type { Response } from 'express';

// ok: auth.cookie.no-samesite
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}

// ok: auth.cookie.no-samesite -- OAuth flow needs Lax
export function setOauthCookie(res: Response, state: string) {
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}
