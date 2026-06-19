import { createHash, randomBytes } from 'node:crypto';

// ok: auth.oauth.no-pkce
export function goodRedirect(
  res: { redirect: (url: string) => void },
  state: string,
  verifier: string,
) {
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function newVerifier() {
  return randomBytes(32).toString('base64url');
}
