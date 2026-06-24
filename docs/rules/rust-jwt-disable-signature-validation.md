# `auth.rust.jwt.disable-signature-validation`

> `Validation::insecure_disable_signature_validation()` turns off JWT

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-JWT-001` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | rust |
| **Technologies** | jsonwebtoken |

## Why this matters

`Validation::insecure_disable_signature_validation()` turns off JWT
signature verification. Once disabled, `decode` accepts any token —
including ones forged or tampered with by an attacker — because the
cryptographic signature is never checked. For OAuth/OIDC this lets an
attacker mint arbitrary access tokens and identities.

Never disable signature validation. Build the validator with the
expected algorithm, e.g. `Validation::new(Algorithm::HS256)` (or the
RS/ES algorithm your issuer uses), and verify the token through
`decode::<Claims>(token, &key, &validation)`.

## ❌ Vulnerable

```rust
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

fn decode_unverified(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.disable-signature-validation
    validation.insecure_disable_signature_validation();
    decode::<Claims>(token, key, &validation).unwrap().claims
}

fn decode_chained(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::default();
    // ruleid: auth.rust.jwt.disable-signature-validation
    let _ = validation.insecure_disable_signature_validation();
    decode::<Claims>(token, key, &validation).unwrap().claims
}
```

## ✅ Safe

```rust
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

// ok: auth.rust.jwt.disable-signature-validation -- expected algorithm, signature verified
fn decode_verified(token: &str, key: &DecodingKey) -> Claims {
    let validation = Validation::new(Algorithm::HS256);
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.disable-signature-validation -- default validation, signature still checked
fn decode_default(token: &str, key: &DecodingKey) -> Claims {
    let validation = Validation::default();
    decode::<Claims>(token, key, &validation).unwrap().claims
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.jwt.disable-signature-validation -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/jsonwebtoken/latest/jsonwebtoken/struct.Validation.html#method.insecure_disable_signature_validation
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
