// ruleid: auth.oauth.no-state
export const authorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&scope=openid%20email&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb';

export function badRedirect(res: { redirect: (url: string) => void }) {
  // ruleid: auth.oauth.no-state
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
