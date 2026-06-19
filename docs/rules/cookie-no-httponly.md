# `auth.cookie.no-httponly`

> A session/auth cookie is being set WITHOUT the `HttpOnly` flag.

| | |
|---|---|
| **OAuthLint id** | `AUTH-COOKIE-002` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-1004](https://cwe.mitre.org/data/definitions/1004.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express, fastify |

## Why this matters

A session/auth cookie is being set WITHOUT the `HttpOnly` flag.
Any XSS that lands on a page in the same origin will be able to
read this cookie via `document.cookie` and exfiltrate the session.

Set `{ httpOnly: true }` on every authentication cookie. If a
front-end framework genuinely needs to read it from JS, that is a
design problem — server-side state is the right answer.

## ❌ Vulnerable

```ts
import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-httponly
  res.cookie('session', token, { secure: true, sameSite: 'lax' });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-httponly
  res.cookie('auth_token', jwt, { secure: true });
}
```

## ✅ Safe

```ts
import type { Response } from 'express';

// ok: auth.cookie.no-httponly
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cookie.no-httponly -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.2.6

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
