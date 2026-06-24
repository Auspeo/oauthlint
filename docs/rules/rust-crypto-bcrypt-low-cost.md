# `auth.rust.crypto.bcrypt-low-cost`

> `bcrypt::hash` (or `bcrypt::hash_with_result`) is called with a cost

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-CRYPTO-002` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | rust |
| **Technologies** | bcrypt |

## Why this matters

`bcrypt::hash` (or `bcrypt::hash_with_result`) is called with a cost
factor below 10. A low work factor makes each hash cheap to compute,
which lets an attacker brute-force stolen password hashes far too
quickly. OWASP recommends a bcrypt cost of at least 10, and ≥ 12 for new
applications, tuned so a single hash takes roughly 250ms on your
hardware.

Common LLM-generated mistake: `bcrypt::hash(password, 8)` because the
literal "looks fast enough". Use `bcrypt::DEFAULT_COST` (12) or raise the
cost factor to 12 or higher.

## ❌ Vulnerable

```rust
use bcrypt;

fn hash_cost_4(password: &str) -> String {
    // ruleid: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, 4).unwrap()
}

fn hash_cost_8(password: &str) -> String {
    // ruleid: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, 8).unwrap()
}

fn hash_cost_9_with_result(password: &str) -> String {
    // ruleid: auth.rust.crypto.bcrypt-low-cost
    let result = bcrypt::hash_with_result(password, 9).unwrap();
    result.to_string()
}
```

## ✅ Safe

```rust
use bcrypt;

fn hash_default_cost(password: &str) -> String {
    // ok: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap()
}

fn hash_cost_12(password: &str) -> String {
    // ok: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, 12).unwrap()
}

fn hash_cost_from_variable(password: &str, cost: u32) -> String {
    // ok: auth.rust.crypto.bcrypt-low-cost
    bcrypt::hash(password, cost).unwrap()
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.crypto.bcrypt-low-cost -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/bcrypt/latest/bcrypt/fn.hash.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cwe.mitre.org/data/definitions/916.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
