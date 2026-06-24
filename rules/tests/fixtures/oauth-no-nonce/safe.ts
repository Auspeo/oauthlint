import { randomBytes } from 'node:crypto';

// ok: auth.oauth.no-nonce
// OIDC request that correctly includes a nonce (URLSearchParams).
export function goodOidcRedirect(res: { redirect: (url: string) => void }, state: string) {
  const nonce = randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
    nonce,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// ok: auth.oauth.no-nonce
// OIDC inline URL that already carries a nonce.
export const oidcUrlWithNonce =
  'https://login.example.com/authorize?client_id=spa&response_type=id_token&scope=openid&state=xyz&nonce=n-0S6_WzA2Mj';

// ok: auth.oauth.no-nonce
// Pure OAuth 2.0 — no `openid` scope, so this is NOT an OIDC request and a
// nonce is not applicable.
export const oauthOnlyUrl =
  'https://github.com/login/oauth/authorize?client_id=abc&response_type=code&scope=repo%20user&state=xyz';

// ok: auth.oauth.no-nonce
// Pure OAuth 2.0 via URLSearchParams — scope has no `openid`.
export function oauthOnlyRedirect(res: { redirect: (url: string) => void }, state: string) {
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'repo user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
