import { randomBytes } from 'node:crypto';

// ok: auth.oauth.no-state
export function goodRedirect(res: { redirect: (url: string) => void }) {
  const state = randomBytes(32).toString('hex');
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
