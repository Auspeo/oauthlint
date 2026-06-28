// Resource Owner Password Credentials (ROPC) grant — deprecated by RFC 9700,
// removed in OAuth 2.1. The app handles the raw user password.

export async function loginObjectBody(username: string, password: string) {
  // ruleid: auth.oauth.ropc-grant
  const body = {
    grant_type: 'password',
    username,
    password,
    client_id: 'web-app',
  };
  return fetch('https://idp.example.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function loginFormString(username: string, password: string) {
  // ruleid: auth.oauth.ropc-grant
  const body = `grant_type=password&username=${username}&password=${password}&client_id=web-app`;
  return fetch('https://idp.example.com/oauth/token', { method: 'POST', body });
}

export async function loginUrlSearchParams(username: string, password: string) {
  const params = new URLSearchParams();
  // ruleid: auth.oauth.ropc-grant
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);
  return fetch('https://idp.example.com/oauth/token', { method: 'POST', body: params });
}
