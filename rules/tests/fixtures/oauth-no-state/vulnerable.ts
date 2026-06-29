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

// Per-literal proof: this file mixes a CORRECT authorize URL (carries `state=`)
// with a broken one (no `state=`). The old file-level regex saw `state=`
// anywhere in the file and suppressed BOTH (a false negative). Only the
// state-less literal must flag now.
export const correctAuthorize =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&state=xyz789&scope=openid';
// ruleid: auth.oauth.no-state
export const brokenAuthorize =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&scope=openid';
