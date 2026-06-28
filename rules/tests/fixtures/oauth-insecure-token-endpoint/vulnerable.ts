// OAuth/OIDC endpoints contacted over cleartext http:// — codes, secrets and
// tokens travel unencrypted.

// ruleid: auth.oauth.insecure-token-endpoint
export const authorizeUrl =
  'http://auth.example.com/authorize?response_type=code&client_id=abc&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb';

export async function exchange(code: string) {
  // ruleid: auth.oauth.insecure-token-endpoint
  return fetch('http://idp.example.com/oauth/token', {
    method: 'POST',
    body: `grant_type=authorization_code&code=${code}&client_id=abc`,
  });
}

// IdentityServer-style discovery / token path over http.
// ruleid: auth.oauth.insecure-token-endpoint
const tokenEndpoint = 'http://login.example.com/connect/token';

export function useToken() {
  return tokenEndpoint;
}
