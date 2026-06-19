# `auth.oauth.no-pkce`

> OAuth 2.0 authorization request looks like a public client (SPA,

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-004` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-345](https://cwe.mitre.org/data/definitions/345.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

OAuth 2.0 authorization request looks like a public client (SPA,
mobile, or native app) but does not include a `code_challenge`
parameter. Without PKCE, the authorization code can be intercepted
and exchanged by an attacker.

RFC 8252 §6 mandates PKCE for native/SPA clients. RFC 9700 (OAuth 2.0
Security BCP) recommends PKCE for ALL clients, including confidential
ones, as defence in depth.

Generate a `code_verifier` (43-128 char), derive `code_challenge =
BASE64URL-NoPad(SHA256(code_verifier))`, send it with
`code_challenge_method=S256` on the authorize call, and POST the
`code_verifier` on the token call.

## ❌ Vulnerable

```ts
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
```

## ✅ Safe

```ts
import { createHash, randomBytes } from 'node:crypto';

// ok: auth.oauth.no-pkce
export function goodRedirect(
  res: { redirect: (url: string) => void },
  state: string,
  verifier: string,
) {
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function newVerifier() {
  return randomBytes(32).toString('base64url');
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.no-pkce -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7636
- https://datatracker.ietf.org/doc/html/rfc8252#section-6

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
