# `auth.flow.weak-bcrypt-rounds`

> A bcrypt cost factor below 10 was used. A low work factor makes the

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-007` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | javascript, typescript |
| **Technologies** | bcrypt, bcryptjs |

## Why this matters

A bcrypt cost factor below 10 was used. A low work factor makes the
hash cheap to compute, which lets an attacker brute-force stolen
password hashes far too quickly. OWASP recommends a bcrypt cost of at
least 10, and ≥ 12 for new applications, tuned so a single hash takes
roughly 250ms on your hardware.

Common LLM-generated mistake: `bcrypt.hash(pw, 8)` or
`bcrypt.genSalt(5)` because the literal "looks fast enough". Raise the
cost factor to 12 or higher.

## ❌ Vulnerable

```ts
// `bcrypt` here is the bcryptjs package — the API surface is identical and
// LLMs frequently alias it to `bcrypt` on import.
import bcrypt from 'bcryptjs';

// ruleid: auth.flow.weak-bcrypt-rounds
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 8);
}

// ruleid: auth.flow.weak-bcrypt-rounds
export async function makeSalt() {
  return bcrypt.genSalt(5);
}

// ruleid: auth.flow.weak-bcrypt-rounds
export function hashSyncPassword(pw: string) {
  return bcrypt.hashSync(pw, 9);
}

// ruleid: auth.flow.weak-bcrypt-rounds -- hash with 3-arg callback form
export function hashWithCallback(pw: string) {
  bcrypt.hash(pw, 4, (_err, _hash) => {});
}

// ruleid: auth.flow.weak-bcrypt-rounds -- genSaltSync low cost
export function makeSaltSync() {
  return bcrypt.genSaltSync(6);
}
```

## ✅ Safe

```ts
import bcrypt from 'bcrypt';

const saltRounds = 12;

// ok: auth.flow.weak-bcrypt-rounds
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

// ok: auth.flow.weak-bcrypt-rounds -- exactly at the recommended floor
export async function makeSalt() {
  return bcrypt.genSalt(10);
}

// ok: auth.flow.weak-bcrypt-rounds -- cost factor comes from a constant
export function hashWithConstant(pw: string) {
  return bcrypt.hashSync(pw, saltRounds);
}

// ok: auth.flow.weak-bcrypt-rounds -- cost factor from config variable
export function hashWithVar(pw: string, rounds: number) {
  return bcrypt.hash(pw, rounds);
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.weak-bcrypt-rounds -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
