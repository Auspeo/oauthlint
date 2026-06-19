// ruleid: auth.oauth.no-pkce
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=spa-app&response_type=code&scope=openid&state=abc';

export function badRedirect(res: { redirect: (url: string) => void }, state: string) {
  // ruleid: auth.oauth.no-pkce
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
