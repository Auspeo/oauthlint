// Hardcoded, constant `state` — identical on every request, so it provides no
// CSRF protection at all.

// ruleid: auth.oauth.static-state
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&state=xyz123&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb';

export function buildAuthorize(res: { redirect: (url: string) => void }) {
  // ruleid: auth.oauth.static-state
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state: 'static-state-value',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
