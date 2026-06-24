# `auth.rust.jwt.no-expiration-validation`

> JWT expiration validation is turned off by setting `validate_exp: false`

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-JWT-003` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) |
| **OWASP** | API2:2023 |
| **Languages** | rust |
| **Technologies** | jsonwebtoken |

## Why this matters

JWT expiration validation is turned off by setting `validate_exp: false`
on the `jsonwebtoken` `Validation`. With `exp` checking disabled, `decode`
accepts tokens that have already expired, so a leaked or stolen access
token stays usable forever. For OAuth/OIDC this defeats token lifetimes
and revocation-by-expiry, letting an attacker replay old tokens.

Leave `validate_exp` at its default `true` so expired tokens are
rejected. Build the validator with `Validation::new(Algorithm::HS256)`
(or your issuer's algorithm) and do not turn off `validate_exp`.

## ❌ Vulnerable

```rust
use jsonwebtoken::{Algorithm, Validation};

fn build_validation_assign() -> Validation {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.no-expiration-validation
    validation.validate_exp = false;
    validation
}

fn build_validation_assign_default() -> Validation {
    let mut v = Validation::default();
    // ruleid: auth.rust.jwt.no-expiration-validation
    v.validate_exp = false;
    v
}
```

## ✅ Safe

```rust
use jsonwebtoken::{Algorithm, Validation};

fn build_validation_default() -> Validation {
    // ok: auth.rust.jwt.no-expiration-validation
    Validation::new(Algorithm::HS256)
}

fn build_validation_literal() -> Validation {
    // ok: auth.rust.jwt.no-expiration-validation
    Validation {
        algorithms: vec![Algorithm::HS256],
        validate_exp: true,
        ..Default::default()
    }
}

fn build_validation_assign() -> Validation {
    let mut validation = Validation::new(Algorithm::HS256);
    // ok: auth.rust.jwt.no-expiration-validation
    validation.validate_exp = true;
    validation
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.jwt.no-expiration-validation -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/jsonwebtoken/latest/jsonwebtoken/struct.Validation.html#structfield.validate_exp
- https://cwe.mitre.org/data/definitions/613.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
