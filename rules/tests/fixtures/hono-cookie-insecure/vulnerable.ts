import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';

const app = new Hono();

app.post('/login', (c) => {
  const token = issueToken();

  // ruleid: auth.hono.cookie-insecure
  setCookie(c, 'session', token, { httpOnly: false, secure: true });

  // ruleid: auth.hono.cookie-insecure
  setCookie(c, 'auth_token', token, { httpOnly: true, secure: false });

  // ruleid: auth.hono.cookie-insecure
  setCookie(c, 'sid', token, { httpOnly: true, sameSite: 'Lax' });

  // ruleid: auth.hono.cookie-insecure
  setCookie(c, 'refresh_token', token);

  return c.json({ ok: true });
});
