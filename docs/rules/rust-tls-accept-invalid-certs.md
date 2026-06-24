# `auth.rust.tls.accept-invalid-certs`

> A reqwest client is built with `danger_accept_invalid_certs(true)`, which

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-TLS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-295](https://cwe.mitre.org/data/definitions/295.html) |
| **OWASP** | A02:2021 |
| **Languages** | rust |
| **Technologies** | reqwest |

## Why this matters

A reqwest client is built with `danger_accept_invalid_certs(true)`, which
turns off TLS certificate validation. Any attacker who can intercept the
connection can present any certificate and read or tamper with the
traffic — a man-in-the-middle hole. For OAuth/OIDC this leaks
authorization codes, access tokens, and client secrets in transit.

Never accept invalid certificates. Leave validation on (the default). To
trust a private CA in development, add it explicitly with
`ClientBuilder::add_root_certificate(cert)` instead.

## ❌ Vulnerable

```rust
use reqwest::Client;

fn build_insecure() -> Client {
    // ruleid: auth.rust.tls.accept-invalid-certs
    reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .unwrap()
}

fn build_insecure_inline() -> Client {
    let builder = reqwest::Client::builder().timeout(std::time::Duration::from_secs(30));
    // ruleid: auth.rust.tls.accept-invalid-certs
    builder.danger_accept_invalid_certs(true).build().unwrap()
}
```

## ✅ Safe

```rust
use reqwest::Client;

// ok: auth.rust.tls.accept-invalid-certs -- validation left on (default)
fn build_default() -> Client {
    reqwest::Client::builder().build().unwrap()
}

// ok: auth.rust.tls.accept-invalid-certs -- explicitly false
fn build_explicit_false() -> Client {
    reqwest::Client::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .unwrap()
}

// ok: auth.rust.tls.accept-invalid-certs -- private CA added explicitly, not skipping
fn build_with_ca(cert: reqwest::Certificate) -> Client {
    reqwest::Client::builder()
        .add_root_certificate(cert)
        .build()
        .unwrap()
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.tls.accept-invalid-certs -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/reqwest/latest/reqwest/struct.ClientBuilder.html#method.danger_accept_invalid_certs
- https://cwe.mitre.org/data/definitions/295.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
