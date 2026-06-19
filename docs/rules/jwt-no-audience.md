# `auth.jwt.no-audience`

> JWT is being verified without checking the `aud` (audience) claim.

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-004` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-345](https://cwe.mitre.org/data/definitions/345.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

JWT is being verified without checking the `aud` (audience) claim.
A token issued for one of your services (e.g. an internal worker)
can then be replayed against another service that trusts the same
key, leading to confused-deputy attacks.

Pass `{ audience: 'your-api' }` to `jwt.verify` (or validate the
`aud` claim manually) on every verification path.

RFC 7519 §4.1.3 defines the `aud` claim explicitly for this use case.

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-audience
export function verifyBad(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}

// ruleid: auth.jwt.no-audience
export function verifyBad2(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!);
}

// ruleid: auth.jwt.no-audience -- callback form without audience
export function verifyBad3(token: string) {
  jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] }, (_e, _d) => {});
}
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';

// ok: auth.jwt.no-audience
export function verifyGood(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
    algorithms: ['RS256'],
    audience: 'example-api',
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.no-audience -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.3

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
