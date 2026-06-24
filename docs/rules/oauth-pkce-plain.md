# `auth.oauth.pkce-plain`

> PKCE is configured with `code_challenge_method=plain`. The `plain`

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-011` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-757](https://cwe.mitre.org/data/definitions/757.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | oauth |

## Why this matters

PKCE is configured with `code_challenge_method=plain`. The `plain`
method sends the `code_verifier` itself as the `code_challenge`, so an
attacker who intercepts the authorization request learns the verifier
and PKCE provides no protection against authorization-code interception.

Use `code_challenge_method=S256`: derive `code_challenge =
BASE64URL-NoPad(SHA256(code_verifier))` (RFC 7636 §4.2). S256 is
mandatory for clients that can compute SHA-256.

## ❌ Vulnerable

```ts
// ruleid: auth.oauth.pkce-plain
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=spa-app&response_type=code&state=abc&code_challenge=xyz&code_challenge_method=plain';

export function badPkceObject(verifier: string) {
  // ruleid: auth.oauth.pkce-plain
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    state: 'abc',
    code_challenge: verifier,
    code_challenge_method: 'plain',
  });
  return params.toString();
}

export function badPkceAppend(verifier: string) {
  const params = new URLSearchParams();
  params.set('client_id', 'spa-app');
  params.set('response_type', 'code');
  params.set('code_challenge', verifier);
  // ruleid: auth.oauth.pkce-plain
  params.append('code_challenge_method', 'plain');
  return params.toString();
}
```

## ✅ Safe

```ts
import { createHash } from 'node:crypto';

// ok: auth.oauth.pkce-plain
export const authorizeUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=spa-app&response_type=code&state=abc&code_challenge=xyz&code_challenge_method=S256';

// ok: auth.oauth.pkce-plain
export function goodPkceObject(verifier: string) {
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    state: 'abc',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return params.toString();
}

// ok: auth.oauth.pkce-plain
export function noPkce(state: string) {
  // No PKCE at all — out of scope for this rule (see auth.oauth.no-pkce).
  const params = new URLSearchParams({
    client_id: 'spa-app',
    response_type: 'code',
    state,
  });
  return params.toString();
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.pkce-plain -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7636#section-4.2

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
