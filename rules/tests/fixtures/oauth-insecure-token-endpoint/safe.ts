// All OAuth/OIDC endpoints use TLS; the only http:// URL is a loopback dev
// host, which is explicitly allowed.

// ok: auth.oauth.insecure-token-endpoint
export const authorizeUrl =
  'https://auth.example.com/authorize?response_type=code&client_id=abc&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb';

export async function exchange(code: string) {
  // ok: auth.oauth.insecure-token-endpoint
  return fetch('https://idp.example.com/oauth/token', {
    method: 'POST',
    body: `grant_type=authorization_code&code=${code}&client_id=abc`,
  });
}

// Local development against a loopback IdP — not flagged.
// ok: auth.oauth.insecure-token-endpoint
const devTokenEndpoint = 'http://localhost:8080/connect/token';

// A plain http URL with no OAuth markers is out of scope for this rule.
// ok: auth.oauth.insecure-token-endpoint
const healthCheck = 'http://status.example.com/healthz';

export function endpoints() {
  return [devTokenEndpoint, healthCheck];
}
