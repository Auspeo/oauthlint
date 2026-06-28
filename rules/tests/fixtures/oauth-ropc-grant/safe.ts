// Authorization-code and client-credentials grants — the supported flows.
// None of these collect or replay the user's password.

export async function exchangeCode(code: string, verifier: string) {
  // ok: auth.oauth.ropc-grant
  const body = {
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    client_id: 'web-app',
  };
  return fetch('https://idp.example.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function machineToken() {
  // ok: auth.oauth.ropc-grant
  const body = 'grant_type=client_credentials&client_id=svc&client_secret=shh';
  return fetch('https://idp.example.com/oauth/token', { method: 'POST', body });
}

export async function refresh(refreshToken: string) {
  const params = new URLSearchParams();
  // ok: auth.oauth.ropc-grant
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  return fetch('https://idp.example.com/oauth/token', { method: 'POST', body: params });
}

// A field literally named `password` that is NOT an OAuth grant_type must not
// trip the rule.
export function resetForm(password: string) {
  return { action: 'reset', password };
}
