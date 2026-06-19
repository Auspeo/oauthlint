# `auth.jwt.alg-none`

> JWTs are being verified with the `none` algorithm in the allowed list.

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken, jose |

## Why this matters

JWTs are being verified with the `none` algorithm in the allowed list.
An attacker can forge any token by simply setting `alg: none` in the header
and supplying no signature, because the verification routine will accept it.

Restrict `algorithms` to the ones you actually use, e.g. ["RS256"] or ["ES256"].
Never include "none" or "None" in production code paths.

RFC 7518 §3.6 explicitly warns: "Implementations SHOULD NOT support the
'none' algorithm in deployed systems."

## ❌ Vulnerable

```ts
// ruleid: auth.jwt.alg-none
import jwt from 'jsonwebtoken';

export function badVerify(token: string) {
  return jwt.verify(token, 'k', { algorithms: ['RS256', 'none'] });
}

// ruleid: auth.jwt.alg-none
export function badVerify2(token: string) {
  return jwt.verify(token, 'k', { algorithms: ['none'] });
}

import { verify } from 'jsonwebtoken';
// ruleid: auth.jwt.alg-none -- destructured import
export function badVerifyDestructured(token: string) {
  return verify(token, 'k', { algorithms: ['none'] });
}
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';

// ok: auth.jwt.alg-none
export function goodVerify(token: string) {
  return jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.alg-none -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7518#section-3.6
- https://owasp.org/www-project-api-security/

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
