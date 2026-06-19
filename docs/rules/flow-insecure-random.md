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

// ruleid: auth.flow.insecure-random -- the most common insecure-token idiom
const apiToken = Math.random().toString(36).slice(2);

// ruleid: auth.flow.insecure-random
const verifyToken = Math.random().toString(36).substring(2);

// ruleid: auth.flow.insecure-random -- Math.floor wrapper
const sessionIdNum = Math.floor(Math.random() * 1e9);

// ruleid: auth.flow.insecure-random -- var, not const/let
var legacyToken = Math.random().toString(36);

class Session {
  resetToken = '';
  rotate() {
    // ruleid: auth.flow.insecure-random -- member assignment
    this.resetToken = Math.random().toString(36).slice(2);
  }
}

export { csrfToken, sessionId, otpCode, resetCode, apiToken, verifyToken, sessionIdNum, legacyToken, Session };
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

// These names contain security-word *substrings* but are not secrets, and use
// Math.random() legitimately — regression guards against substring matches.
// ok: auth.flow.insecure-random -- "barcode" is not a security token
export const barcode = Math.random().toString(36);
// ok: auth.flow.insecure-random -- "zipcode" is not a security token
export const zipcode = Math.random().toString().slice(2, 7);
// ok: auth.flow.insecure-random -- camelCase, unrelated UI state
export const gameState = Math.random();
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

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
