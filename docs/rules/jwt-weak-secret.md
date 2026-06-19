# `auth.jwt.weak-secret`

> JWT signing or verification uses a hard-coded secret. Anyone who reads

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | jsonwebtoken |

## Why this matters

JWT signing or verification uses a hard-coded secret. Anyone who reads
the source (including via leaked GitHub commits) can forge valid tokens.

Move the secret to an environment variable or secret manager, and ensure
the value is at least 256 bits (32 ASCII characters) when using HMAC-based
algorithms (HS256/HS384/HS512).

Real-world incident: 24,008 unique secrets were found in MCP config files
and 3.2% of Claude Code commits leaked secrets in GitGuardian's 2026 report.

## ❌ Vulnerable

```ts
import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.weak-secret
export const token1 = jwt.sign({ uid: 1 }, 'secret');

// ruleid: auth.jwt.weak-secret
export const token2 = jwt.sign({ uid: 2 }, 'changeme');

// ruleid: auth.jwt.weak-secret
export function verifyBad(t: string) {
  return jwt.verify(t, 'mySecret');
}

import { sign } from 'jsonwebtoken';
// ruleid: auth.jwt.weak-secret -- destructured import
export const token3 = sign({ uid: 3 }, 'secret');
```

## ✅ Safe

```ts
import jwt from 'jsonwebtoken';

// ok: auth.jwt.weak-secret
export const token = jwt.sign({ uid: 1 }, process.env.JWT_SECRET!);

// ok: auth.jwt.weak-secret
export function verifyGood(t: string) {
  return jwt.verify(t, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.weak-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc7518#section-3.2
- https://cwe.mitre.org/data/definitions/798.html

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
