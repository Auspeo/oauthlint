// ruleid: auth.oauth.no-nonce
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&scope=openid%20email&state=xyz&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb';

// ruleid: auth.oauth.no-nonce
export const implicitUrl =
  'https://login.example.com/authorize?client_id=spa&response_type=id_token&scope=openid&state=xyz';

export function badRedirect(res: { redirect: (url: string) => void }, state: string) {
  // ruleid: auth.oauth.no-nonce
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email profile',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function badHybridRedirect(res: { redirect: (url: string) => void }, state: string) {
  // ruleid: auth.oauth.no-nonce
  const params = new URLSearchParams({
    client_id: 'spa',
    response_type: 'code id_token',
    scope: 'openid',
    state,
  });
  res.redirect(`https://login.example.com/authorize?${params.toString()}`);
}
