# `auth.jwt.decode-without-verify`

> `jwt.decode()` from `jsonwebtoken` only parses the token — it does NOT

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-009` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

`jwt.decode()` from `jsonwebtoken` only parses the token — it does NOT
verify the signature. Trusting any claim returned by `decode()` (e.g.
`sub`, `role`, `scope`) lets an attacker forge a token and bypass
authentication entirely.

Use `jwt.verify(token, secret, { algorithms: ['RS256'] })`, which checks
the signature before returning the payload. Only use `decode()` for
non-security-sensitive inspection (e.g. reading `kid` before verifying).

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';
import { decode } from 'jsonwebtoken';

declare const token: string;
declare const t: string;
declare const req: { headers: { authorization: string } };

// ruleid: auth.jwt.decode-without-verify
const p = jwt.decode(token);

// ruleid: auth.jwt.decode-without-verify
const fromHeader = jwt.decode(req.headers.authorization);

// ruleid: auth.jwt.decode-without-verify
const { sub } = jwt.decode(t) as { sub: string };

// ruleid: auth.jwt.decode-without-verify
const complete = jwt.decode(token, { complete: true });

// ruleid: auth.jwt.decode-without-verify
const viaImport = decode(token);

export { p, fromHeader, sub, complete, viaImport };
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';
import { decodeJwt } from 'jose';

declare const token: string;

// ok: auth.jwt.decode-without-verify -- verify() checks the signature
const verified = jwt.verify(token, process.env.JWT_SECRET!, {
  algorithms: ['RS256'],
});

// ok: auth.jwt.decode-without-verify -- jose.decodeJwt is a different library, out of scope
const joseClaims = decodeJwt(token);

// ok: auth.jwt.decode-without-verify -- a custom decode() unrelated to jsonwebtoken
function decode(value: string): string {
  return Buffer.from(value, 'base64').toString('utf8');
}
const custom = decode(token);

export { verified, joseClaims, custom };
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.decode-without-verify -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://github.com/auth0/node-jsonwebtoken#jwtdecodetoken--options
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
