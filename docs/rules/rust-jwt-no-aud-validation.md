# `auth.rust.jwt.no-aud-validation`

> JWT audience (`aud`) validation is disabled by setting

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-JWT-004` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-287](https://cwe.mitre.org/data/definitions/287.html) |
| **OWASP** | API2:2023 |
| **Languages** | rust |
| **Technologies** | jsonwebtoken |

## Why this matters

JWT audience (`aud`) validation is disabled by setting
`validate_aud: false` on the `jsonwebtoken` `Validation`. With the
audience check turned off, a token minted for a different service is
accepted by `decode`, so an attacker can replay a token issued for
another audience against this API.

Keep `validate_aud` at its default `true` and declare the audience you
expect via `validation.set_audience(&["my-api"])`, so only tokens whose
`aud` claim matches your service are accepted.

## ❌ Vulnerable

```rust
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    aud: String,
    exp: usize,
}

fn decode_assignment(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.no-aud-validation
    validation.validate_aud = false;
    decode::<Claims>(token, key, &validation).unwrap().claims
}

fn decode_assignment_default(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::default();
    // ruleid: auth.rust.jwt.no-aud-validation
    validation.validate_aud = false;
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
    aud: String,
    exp: usize,
}

// ok: auth.rust.jwt.no-aud-validation -- audience explicitly validated
fn decode_with_audience(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["my-api"]);
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.no-aud-validation -- default validation keeps validate_aud = true
fn decode_default(token: &str, key: &DecodingKey) -> Claims {
    let validation = Validation::new(Algorithm::HS256);
    decode::<Claims>(token, key, &validation).unwrap().claims
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.jwt.no-aud-validation -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/jsonwebtoken/latest/jsonwebtoken/struct.Validation.html#structfield.validate_aud
- https://cwe.mitre.org/data/definitions/287.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
