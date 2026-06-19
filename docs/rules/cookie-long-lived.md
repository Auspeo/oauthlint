# `auth.cookie.long-lived`

> An auth-looking cookie is being set with a `maxAge` greater than

| | |
|---|---|
| **OAuthLint id** | `AUTH-COOKIE-004` |
| **Severity** | INFO |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express, fastify |

## Why this matters

An auth-looking cookie is being set with a `maxAge` greater than
30 days (the threshold is 30 × 24 × 60 × 60 × 1000 = 2_592_000_000
milliseconds). Long-lived session cookies expand the blast radius
of any single token theft and bypass server-side revocation if
the application doesn't validate freshness on every request.

Prefer short-lived access cookies (15-60 min) paired with a
separate refresh token rotation flow. If you really need a "remember
me" cookie, scope it tightly (`SameSite=Strict`, dedicated path) and
back it with a server-side allowlist you can revoke.

## ❌ Vulnerable

```ts
import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.long-lived
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 31_536_000_000, // 1 year
  });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.long-lived
  res.cookie('refresh_token', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7776000000,
  });
}
```

## ✅ Safe

```ts
import type { Response } from 'express';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ok: auth.cookie.long-lived
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: FIFTEEN_MIN_MS,
  });
}

// ok: auth.cookie.long-lived -- still under 30 days
export function rememberMeOk(res: Response, refresh: string) {
  res.cookie('refresh_token', refresh, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: ONE_WEEK_MS,
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cookie.long-lived -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
