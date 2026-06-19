# `auth.flow.insecure-random`

> `Math.random()` is being assigned to (or used to compute) a value

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-003` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-338](https://cwe.mitre.org/data/definitions/338.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |

## Why this matters

`Math.random()` is being assigned to (or used to compute) a value
whose name indicates it is security-sensitive — a token, a CSRF
value, an OAuth `state`, a session id, a nonce, or a verification
code. `Math.random()` is NOT cryptographically secure and is
predictable enough for an attacker with enough samples to recover
the seed.

Use `crypto.randomBytes(N)` (Node) or `crypto.getRandomValues()`
(browser) and base64url-encode the result.

OWASP ASVS V2.5: all security-sensitive random values must come
from a CSPRNG.

## ❌ Vulnerable

```ts
// ruleid: auth.flow.insecure-random
const csrfToken = Math.random();

// ruleid: auth.flow.insecure-random
const sessionId = Math.random().toString(36);

// ruleid: auth.flow.insecure-random
const otpCode = Math.random();

// ruleid: auth.flow.insecure-random
const resetCode = Math.random().toString(36);

export { csrfToken, sessionId, otpCode, resetCode };
```

## ✅ Safe

```ts
import { randomBytes } from 'node:crypto';

// ok: auth.flow.insecure-random
export const csrfToken = randomBytes(32).toString('base64url');

// ok: auth.flow.insecure-random -- non-security value
export const animationDelay = Math.random() * 200;

// ok: auth.flow.insecure-random -- non-security value
export const pickColor = Math.random();
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.insecure-random -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- https://cwe.mitre.org/data/definitions/338.html

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
