# `auth.jwt.algorithm-confusion`

> A JWT is being verified with HS256 (a symmetric algorithm) but the

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-007` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

A JWT is being verified with HS256 (a symmetric algorithm) but the
key looks like an RSA / EC public key in PEM format. This is the
"algorithm confusion" attack: an attacker can sign forged tokens
with the public key and your code will happily verify them with
HMAC-SHA256 treating the PEM string as the shared secret.

Always pin the algorithm to the asymmetric one you actually use
(e.g. `algorithms: ['RS256']`) and pass the public key only when
verifying asymmetric tokens.

RFC 7518 §3.1 — the "alg" header must be matched to the key type.

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';

const RSA_PUBLIC = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxxxxxxxxxxxxxxxxxxxx
-----END PUBLIC KEY-----`;

// ruleid: auth.jwt.algorithm-confusion
export function badVerify(token: string) {
  return jwt.verify(token, RSA_PUBLIC, { algorithms: ['HS256'] });
}

// ruleid: auth.jwt.algorithm-confusion -- mixing HS with an RSA public key
export function badVerifyMixed(token: string, publicKey: string) {
  return jwt.verify(token, publicKey, { algorithms: ['HS256', 'RS256'] });
}
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';

const RSA_PUBLIC = process.env.JWT_PUBLIC_KEY!;
const HMAC_SECRET = process.env.JWT_HMAC_SECRET!;

// ok: auth.jwt.algorithm-confusion -- RS256 matches the asymmetric key
export function goodVerifyAsymmetric(token: string) {
  return jwt.verify(token, RSA_PUBLIC, { algorithms: ['RS256'] });
}

// ok: auth.jwt.algorithm-confusion -- HS256 with a real shared secret, not a PEM
export function goodVerifySymmetric(token: string) {
  return jwt.verify(token, HMAC_SECRET, { algorithms: ['HS256'] });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.algorithm-confusion -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7518#section-3.1
- https://owasp.org/www-project-api-security/

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
