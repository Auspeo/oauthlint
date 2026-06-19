# `auth.cookie.no-samesite`

> A session/auth cookie is being set WITHOUT the `SameSite`

| | |
|---|---|
| **OAuthLint id** | `AUTH-COOKIE-003` |
| **Severity** | INFO |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-1275](https://cwe.mitre.org/data/definitions/1275.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express, fastify |

## Why this matters

A session/auth cookie is being set WITHOUT the `SameSite`
attribute. Modern browsers default to `Lax`, but explicit is
better — and APIs that legitimately need cross-site usage should
consciously opt into `None` (with `Secure`), not silently inherit
whatever the browser does today.

For most auth flows, `SameSite=Strict` is the right answer; for
OAuth callbacks, `SameSite=Lax` is required.

## ❌ Vulnerable

```ts
import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-samesite
  res.cookie('session', token, { httpOnly: true, secure: true });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-samesite
  res.cookie('refresh_token', jwt, { httpOnly: true });
}

export function loginBad3(res: Response, token: string) {
  // ruleid: auth.cookie.no-samesite -- SameSite=None without Secure
  res.cookie('session', token, { httpOnly: true, sameSite: 'none' });
}
```

## ✅ Safe

```ts
import type { Response } from 'express';

// ok: auth.cookie.no-samesite
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}

// ok: auth.cookie.no-samesite -- OAuth flow needs Lax
export function setOauthCookie(res: Response, state: string) {
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

// ok: auth.cookie.no-samesite -- SameSite=None is valid WITH Secure (legit cross-site)
export function setCrossSiteCookie(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cookie.no-samesite -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis-13#section-4.1.2.7

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
