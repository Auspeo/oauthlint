# `auth.oauth.no-nonce`

> OIDC authorization request (scope contains `openid`) is being built

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-010` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-294](https://cwe.mitre.org/data/definitions/294.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | oidc |

## Why this matters

OIDC authorization request (scope contains `openid`) is being built
WITHOUT a `nonce` parameter. The nonce binds the id_token to this
specific authorization request — without it, an attacker can replay or
substitute a stolen/forged id_token (OIDC Core §3.1.2.1).

Generate a cryptographically random `nonce`, store it in the
session/cookie, send it on the authorize call, and verify the `nonce`
claim in the returned id_token. It is REQUIRED for the implicit and
hybrid flows and RECOMMENDED for the authorization-code flow.

## ❌ Vulnerable

```ts
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
```

## ✅ Safe

```ts
import { randomBytes } from 'node:crypto';

// ok: auth.oauth.no-nonce
// OIDC request that correctly includes a nonce (URLSearchParams).
export function goodOidcRedirect(res: { redirect: (url: string) => void }, state: string) {
  const nonce = randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
    nonce,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// ok: auth.oauth.no-nonce
// OIDC inline URL that already carries a nonce.
export const oidcUrlWithNonce =
  'https://login.example.com/authorize?client_id=spa&response_type=id_token&scope=openid&state=xyz&nonce=n-0S6_WzA2Mj';

// ok: auth.oauth.no-nonce
// Pure OAuth 2.0 — no `openid` scope, so this is NOT an OIDC request and a
// nonce is not applicable.
export const oauthOnlyUrl =
  'https://github.com/login/oauth/authorize?client_id=abc&response_type=code&scope=repo%20user&state=xyz';

// ok: auth.oauth.no-nonce
// Pure OAuth 2.0 via URLSearchParams — scope has no `openid`.
export function oauthOnlyRedirect(res: { redirect: (url: string) => void }, state: string) {
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'repo user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.no-nonce -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
