# `auth.jwt.no-algorithms-allowlist`

> `jwt.verify(...)` is called without an explicit `algorithms` allowlist.

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-010` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

`jwt.verify(...)` is called without an explicit `algorithms` allowlist.
Without pinning the accepted algorithms, a token signed with an
unexpected algorithm — or even `alg: none` on older versions — can be
accepted, opening the door to algorithm-confusion attacks.

Always pass the algorithm(s) you actually expect, e.g.
`{ algorithms: ['RS256'] }`.

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims1 = jwt.verify(token, process.env.JWT_SECRET!);

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims2 = jwt.verify(token, publicKey, {
  audience: 'https://api.example.com',
  issuer: 'https://auth.example.com',
});

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims3 = jwt.verify(token, secret, {});

// ruleid: auth.jwt.no-algorithms-allowlist
export const claims4 = jwt.verify(token, secret, { ignoreExpiration: true });
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

// ok: auth.jwt.no-algorithms-allowlist
export const claims1 = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

// ok: auth.jwt.no-algorithms-allowlist -- algorithms + audience pinned together
export const claims2 = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
  audience: 'https://api.example.com',
});

// ok: auth.jwt.no-algorithms-allowlist -- signing is out of scope
export const signed = jwt.sign({ uid: 1 }, secret, { algorithm: 'HS256' });

// ok: auth.jwt.no-algorithms-allowlist -- jose has its own verification API
export const joseClaims = await jwtVerify(token, key);
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.no-algorithms-allowlist -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7518#section-3.1
- https://owasp.org/www-project-api-security/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
