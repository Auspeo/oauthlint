import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';

const app = new Hono();

app.post('/login', (c) => {
  const token = issueToken();

  // Fully hardened auth cookie.
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  // `secure` computed from config (not a hard-coded false) — left alone.
  setCookie(c, 'auth_token', token, { httpOnly: true, secure: isProd });

  // Non-auth cookie (name does not look like a session/auth cookie) — ignored.
  setCookie(c, 'theme', 'dark', { httpOnly: false });

  return c.json({ ok: true });
});
