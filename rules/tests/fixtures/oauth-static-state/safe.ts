import { randomBytes } from 'node:crypto';

// Per-request `state` from a CSPRNG, stored for callback verification.
export function buildAuthorize(
  res: { redirect: (url: string) => void },
  store: (s: string) => void,
) {
  const state = randomBytes(32).toString('hex');
  store(state);
  // ok: auth.oauth.static-state
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// Inline URL whose state is interpolated per request (template literal) — not a
// hardcoded constant.
export function inlineDynamic(state: string): string {
  // ok: auth.oauth.static-state
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&state=${state}`;
}

// Per-literal proof / negative control: `response_type=` lives in ONE string
// literal and a constant `state=` in a DIFFERENT one. The old two-regex form
// combined them across literals into a false positive; the single per-literal
// regex must not flag either of these.
// ok: auth.oauth.static-state
export const authEndpoint =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code';
// ok: auth.oauth.static-state
export const someStateString = 'https://example.com/cb?state=teapot';
