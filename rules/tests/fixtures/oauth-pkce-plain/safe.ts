import { createHash } from 'node:crypto';

// ok: auth.oauth.pkce-plain
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=spa-app&response_type=code&state=abc&code_challenge=xyz&code_challenge_method=S256';

// ok: auth.oauth.pkce-plain
export function goodPkceObject(verifier: string) {
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    state: 'abc',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return params.toString();
}

// ok: auth.oauth.pkce-plain
export function noPkce(state: string) {
  // No PKCE at all — out of scope for this rule (see auth.oauth.no-pkce).
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    state,
  });
  return params.toString();
}
