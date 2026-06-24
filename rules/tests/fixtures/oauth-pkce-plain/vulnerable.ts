// ruleid: auth.oauth.pkce-plain
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=spa-app&response_type=code&state=abc&code_challenge=xyz&code_challenge_method=plain';

export function badPkceObject(verifier: string) {
  // ruleid: auth.oauth.pkce-plain
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    state: 'abc',
    code_challenge: verifier,
    code_challenge_method: 'plain',
  });
  return params.toString();
}

export function badPkceAppend(verifier: string) {
  const params = new URLSearchParams();
  params.set('client_id', 'spa-app');
  params.set('response_type', 'code');
  params.set('code_challenge', verifier);
  // ruleid: auth.oauth.pkce-plain
  params.append('code_challenge_method', 'plain');
  return params.toString();
}
