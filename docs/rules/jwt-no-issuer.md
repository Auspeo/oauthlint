# `auth.jwt.no-issuer`

> JWT is being verified without checking the `iss` (issuer) claim. If

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-006` |
| **Severity** | INFO |
| **LLM prevalence** | LOW |
| **CWE** | [CWE-345](https://cwe.mitre.org/data/definitions/345.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

JWT is being verified without checking the `iss` (issuer) claim. If
your verification key is shared across multiple authorization
servers (or even tenants on a single IdP), this lets a token signed
by one issuer be accepted by code that was meant to trust another.

Pass `{ issuer: 'https://your-idp.example.com' }` to `jwt.verify` so
that the trust chain is explicit. RFC 7519 §4.1.1 defines the
`iss` claim for exactly this purpose.

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-issuer
export function verifyBad(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
    algorithms: ['RS256'],
    audience: 'example-api',
  });
}

// ruleid: auth.jwt.no-issuer -- 2-arg verify has no options, so no issuer check
export function verifyBad2(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';

// ok: auth.jwt.no-issuer
export function verifyGood(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
    algorithms: ['RS256'],
    audience: 'example-api',
    issuer: 'https://idp.oauthlint.dev',
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.no-issuer -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.1

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
