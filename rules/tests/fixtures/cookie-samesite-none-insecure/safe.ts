import type { Response } from 'express';

// ok: auth.cookie.samesite-none-insecure -- None is valid WITH Secure
export function crossSiteGood(res: Response, v: string) {
  res.cookie('sid', v, { httpOnly: true, sameSite: 'none', secure: true });
}

// ok: auth.cookie.samesite-none-insecure -- None (capitalised) WITH Secure
export function crossSiteGood2(res: Response, v: string) {
  res.cookie('sid', v, { httpOnly: true, sameSite: 'None', secure: true });
}

// ok: auth.cookie.samesite-none-insecure -- Lax never requires Secure here
export function laxCookie(res: Response, v: string) {
  res.cookie('sid', v, { httpOnly: true, sameSite: 'lax' });
}

// ok: auth.cookie.samesite-none-insecure -- Strict WITH Secure
export function strictCookie(res: Response, v: string) {
  res.cookie('sid', v, { httpOnly: true, sameSite: 'strict', secure: true });
}

// ok: auth.cookie.samesite-none-insecure -- Set-Cookie header with None AND Secure
export function setCookieHeaderGood(res: Response, v: string) {
  res.setHeader('Set-Cookie', `sid=${v}; HttpOnly; SameSite=None; Secure`);
}
