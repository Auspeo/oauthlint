# `auth.rust.jwt.hardcoded-secret`

> A JWT HMAC signing/verification key is hardcoded as a literal in a call

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-JWT-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API2:2023 |
| **Languages** | rust |
| **Technologies** | jsonwebtoken |

## Why this matters

A JWT HMAC signing/verification key is hardcoded as a literal in a call
to jsonwebtoken's `EncodingKey::from_secret` / `DecodingKey::from_secret`.
Anyone who can read the source or git history can forge or tamper with
tokens, which is a complete authentication bypass.

Load the secret at runtime from the environment or a secret manager
instead, e.g. `let key = std::env::var("JWT_SECRET")?;` followed by
`EncodingKey::from_secret(key.as_bytes())`. Never commit signing keys to
source control.

## ❌ Vulnerable

```rust
use jsonwebtoken::{DecodingKey, EncodingKey};

fn signing_key() -> EncodingKey {
    // ruleid: auth.rust.jwt.hardcoded-secret
    EncodingKey::from_secret(b"supersecret")
}

fn verification_key() -> DecodingKey {
    // ruleid: auth.rust.jwt.hardcoded-secret
    DecodingKey::from_secret(b"supersecret")
}

fn signing_key_str() -> EncodingKey {
    // ruleid: auth.rust.jwt.hardcoded-secret
    EncodingKey::from_secret("hardcoded-literal".as_ref())
}
```

## ✅ Safe

```rust
use jsonwebtoken::EncodingKey;

// ok: auth.rust.jwt.hardcoded-secret -- key comes from a variable, not a literal
fn signing_key_from_var(secret: &str) -> EncodingKey {
    EncodingKey::from_secret(secret.as_bytes())
}

// ok: auth.rust.jwt.hardcoded-secret -- key loaded from the environment at runtime
fn signing_key_from_env() -> EncodingKey {
    let secret = std::env::var("JWT_SECRET").unwrap();
    EncodingKey::from_secret(secret.as_bytes())
}

// ok: auth.rust.jwt.hardcoded-secret -- inline env read, still not a literal
fn signing_key_inline_env() -> EncodingKey {
    EncodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes())
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.jwt.hardcoded-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/jsonwebtoken/latest/jsonwebtoken/struct.EncodingKey.html#method.from_secret
- https://cwe.mitre.org/data/definitions/798.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
