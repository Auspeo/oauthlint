# `auth.rust.flow.timing-unsafe-compare`

> A secret-shaped value (`password`, `token`, `secret`, `apikey`,

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-FLOW-001` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-208](https://cwe.mitre.org/data/definitions/208.html) |
| **OWASP** | API2:2023 |
| **Languages** | rust |
| **Technologies** | std |

## Why this matters

A secret-shaped value (`password`, `token`, `secret`, `apikey`,
`hmac`, `signature`, `mac`, `digest`) is being compared with `==` /
`!=`. Rust's `PartialEq` for slices and strings short-circuits on the
first differing byte, so the comparison time leaks the length of the
matching prefix — a classic timing-attack vector (CWE-208).

Use a constant-time comparison instead: `subtle::ConstantTimeEq`
(`a.ct_eq(b).into()`) or the `constant_time_eq` crate
(`constant_time_eq(a, b)`). For password verification, use a verifier
that compares in constant time for you (`argon2::Argon2::verify_password`,
`bcrypt::verify`, `scrypt`).

## ❌ Vulnerable

```rust
use std::collections::HashMap;

// Non-constant-time comparison of secret-shaped values. Each `==` / `!=`
// short-circuits on the first differing byte and leaks the matching prefix
// length over the wire.

fn check_token(provided_token: &str, expected_token: &str) -> bool {
    // ruleid: auth.rust.flow.timing-unsafe-compare
    provided_token == expected_token
}

fn verify_hmac(hmac: &[u8], computed_hmac: &[u8]) -> bool {
    // ruleid: auth.rust.flow.timing-unsafe-compare
    if hmac != computed_hmac {
        return false;
    }
    true
}

fn login(password: &str, stored_password: &str) -> bool {
    // ruleid: auth.rust.flow.timing-unsafe-compare
    password == stored_password
}

fn check_signature(signature: &str, db: &HashMap<String, String>) -> bool {
    let known = db.get("sig").cloned().unwrap_or_default();
    // ruleid: auth.rust.flow.timing-unsafe-compare
    signature == known
}
```

## ✅ Safe

```rust
use constant_time_eq::constant_time_eq;
use subtle::ConstantTimeEq;

// Constant-time comparison of the secret: not a timing leak.
fn check_token(provided_token: &[u8], expected_token: &[u8]) -> bool {
    // ok: auth.rust.flow.timing-unsafe-compare
    constant_time_eq(provided_token, expected_token)
}

// subtle's ConstantTimeEq: not a timing leak.
fn verify_hmac(hmac: &[u8], computed_hmac: &[u8]) -> bool {
    // ok: auth.rust.flow.timing-unsafe-compare
    hmac.ct_eq(computed_hmac).into()
}

// Length check on a secret-named value: shape check, not a content compare.
fn token_well_formed(token: &str) -> bool {
    // ok: auth.rust.flow.timing-unsafe-compare
    token.len() == 32
}

// Comparison to a string literal: the literal is already public, nothing to leak.
fn is_demo_secret(secret: &str) -> bool {
    // ok: auth.rust.flow.timing-unsafe-compare
    secret == "demo"
}

// Presence check against None: not a byte-by-byte content compare.
fn has_token(token: Option<String>) -> bool {
    // ok: auth.rust.flow.timing-unsafe-compare
    token != None
}

// Non-secret variable names: ordinary equality, not security-sensitive.
fn same_user(username: &str, other: &str) -> bool {
    // ok: auth.rust.flow.timing-unsafe-compare
    username == other
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.flow.timing-unsafe-compare -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/208.html
- https://docs.rs/subtle/latest/subtle/
- https://docs.rs/constant_time_eq/latest/constant_time_eq/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
