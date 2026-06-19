# `auth.cookie.no-secure`

> A cookie that looks like a session or auth cookie is being set WITHOUT

| | |
|---|---|
| **OAuthLint id** | `AUTH-COOKIE-001` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-614](https://cwe.mitre.org/data/definitions/614.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express, fastify |

## Why this matters

A cookie that looks like a session or auth cookie is being set WITHOUT
the `Secure` flag. The browser will happily send it over plain HTTP,
which means a network attacker (open Wi-Fi, malicious proxy, downgrade
attack) can capture it.

Add `{ secure: true }` to the cookie options. If you absolutely need
to set Secure-less cookies in dev, gate it on `NODE_ENV !== 'production'`.

## ❌ Vulnerable

```ts
import type { Response } from 'express';

export function loginBad(res: Response, token: string) {
  // ruleid: auth.cookie.no-secure
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
}

export function loginBad2(res: Response, jwt: string) {
  // ruleid: auth.cookie.no-secure
  res.cookie('auth_token', jwt);
}

export function loginBad3(res: Response, token: string) {
  // ruleid: auth.cookie.no-secure -- secure explicitly disabled
  res.cookie('session', token, { httpOnly: true, secure: false });
}
```

## ✅ Safe

```ts
import type { Response } from 'express';

// ok: auth.cookie.no-secure
export function loginGood(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}

// ok: auth.cookie.no-secure -- conditional secure (the recommended dev gate) must not be flagged
export function loginConditional(res: Response, token: string) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

// ok: auth.cookie.no-secure -- "preferences" is not an auth cookie
export function setPrefs(res: Response, value: string) {
  res.cookie('preferences', value, { httpOnly: false });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cookie.no-secure -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.2.5

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
