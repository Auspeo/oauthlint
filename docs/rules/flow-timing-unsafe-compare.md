# `auth.flow.timing-unsafe-compare`

> A secret-shaped value (`password`, `token`, `secret`, `apiKey`,

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-004` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-208](https://cwe.mitre.org/data/definitions/208.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A secret-shaped value (`password`, `token`, `secret`, `apiKey`,
`csrf`, `hmac`) is being compared with `===` / `!==` /
`string1 == string2`. JavaScript's equality operators short-circuit
on the first differing byte, which leaks the matching prefix
length over the wire — a classic timing-attack vector.

Use `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` (both
buffers must be the same length, so hash first if needed). For
password verification, use `argon2.verify`, `bcrypt.compare`, or
`scrypt` — they handle constant-time comparison for you.

## ❌ Vulnerable

```ts
declare const hashedPassword: string;
declare const submittedToken: string;
declare const expectedHmac: string;
declare const apiKey: string;

export function loginBad(input: string) {
  // ruleid: auth.flow.timing-unsafe-compare
  return input === hashedPassword;
}

export function checkApiKey(provided: string) {
  // ruleid: auth.flow.timing-unsafe-compare
  return provided === apiKey;
}

export function verifyHmac(actualHmac: string) {
  // ruleid: auth.flow.timing-unsafe-compare
  return expectedHmac !== actualHmac;
}

export function loginLoose(input: string) {
  // ruleid: auth.flow.timing-unsafe-compare -- loose equality is just as unsafe
  return input == hashedPassword;
}
```

## ✅ Safe

```ts
import { timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';

// ok: auth.flow.timing-unsafe-compare
export function loginGood(input: string, stored: string) {
  return argon2.verify(stored, input);
}

// ok: auth.flow.timing-unsafe-compare
export function verifyHmacSafe(expected: Buffer, actual: Buffer) {
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ok: auth.flow.timing-unsafe-compare -- comparing non-secret values is fine
export function compareUsernames(a: string, b: string) {
  return a === b;
}

// ok: auth.flow.timing-unsafe-compare -- loose null/presence checks are not comparisons
export function presenceChecks(token?: string) {
  if (token == null) return false;
  if (typeof token != 'string') return false;
  return token.length != 0;
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.timing-unsafe-compare -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
