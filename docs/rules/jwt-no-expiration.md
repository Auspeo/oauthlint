# `auth.jwt.no-expiration`

> JWT is signed without any `expiresIn` / `exp` claim, OR a token is

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-003` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

JWT is signed without any `expiresIn` / `exp` claim, OR a token is
verified without an `maxAge` check. A stolen token therefore remains
valid forever.

Always set a reasonable expiration on access tokens (5-60 minutes is
typical) and verify it with `{ maxAge: '15m' }` or by validating the
`exp` claim explicitly.

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-expiration
export const noExp = jwt.sign({ uid: 1 }, process.env.JWT_SECRET!);

// ruleid: auth.jwt.no-expiration
export const noExp2 = jwt.sign({ uid: 2, role: 'admin' }, process.env.JWT_SECRET!, {
  algorithm: 'HS256',
});
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';

// ok: auth.jwt.no-expiration
export const accessToken = jwt.sign({ uid: 1 }, process.env.JWT_SECRET!, {
  expiresIn: '15m',
});

// ok: auth.jwt.no-expiration
export const refreshToken = jwt.sign(
  { uid: 1, exp: Math.floor(Date.now() / 1000) + 3600 },
  process.env.JWT_SECRET!,
);
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.no-expiration -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
