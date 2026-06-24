// ok: auth.flow.credentials-in-url -- OAuth authorization code in callback URL is normal
export function handleCallback(authCode: string) {
  return `https://app.example.com/callback?code=${authCode}`;
}

// ok: auth.flow.credentials-in-url -- CSRF state parameter is not a secret credential
export function buildState(state: string) {
  return `https://auth.example.com/authorize?response_type=code&state=${state}`;
}

// ok: auth.flow.credentials-in-url -- password sent in POST body, not the URL
export function login(password: string) {
  return fetch('https://api.example.com/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ok: auth.flow.credentials-in-url -- credential in Authorization header, not URL
export function callApi(accessToken: string) {
  return fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ok: auth.flow.credentials-in-url -- email reset link uses a non-secret reset_token name
export const resetLink = 'https://app.example.com/reset?reset_token=xyz';

// ok: auth.flow.credentials-in-url -- passing access_token as a query param to a
// provider's userinfo/API endpoint is a legitimate (sometimes mandated)
// server-side OAuth pattern, so it is deliberately not flagged.
export function fetchUserInfo(url: URL, accessToken: string) {
  url.searchParams.set('access_token', accessToken);
  return fetch(url);
}
