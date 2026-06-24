# `auth.rust.cors.permissive`

> A wide-open CORS policy is configured. `Cors::permissive()` (actix-web),

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-CORS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| **OWASP** | A05:2021 |
| **Languages** | rust |
| **Technologies** | actix-web, tower-http |

## Why this matters

A wide-open CORS policy is configured. `Cors::permissive()` (actix-web),
`CorsLayer::permissive()` / `CorsLayer::very_permissive()` (tower-http),
and `CorsLayer::new().allow_origin(Any)` all allow requests from any
origin. Combined with credentialed requests this lets any website read
authenticated responses — including OAuth/OIDC tokens, session data, and
user info exposed by your API.

Restrict CORS to an explicit allowlist of trusted origins instead, e.g.
`allow_origin("https://app.example.com".parse().unwrap())` or
`allow_origin(["https://app.example.com".parse().unwrap()])`.

## ❌ Vulnerable

```rust
use actix_cors::Cors;
use tower_http::cors::{Any, CorsLayer};

// actix-web: fully permissive CORS.
fn actix_cors() -> Cors {
    // ruleid: auth.rust.cors.permissive
    Cors::permissive()
}

// tower-http: permissive layer allows any origin, method, and header.
fn tower_permissive() -> CorsLayer {
    // ruleid: auth.rust.cors.permissive
    CorsLayer::permissive()
}

// tower-http: explicit wide-open origin.
fn tower_any_origin() -> CorsLayer {
    // ruleid: auth.rust.cors.permissive
    CorsLayer::new().allow_origin(Any)
}
```

## ✅ Safe

```rust
use actix_cors::Cors;
use tower_http::cors::CorsLayer;

// ok: auth.rust.cors.permissive -- actix: explicit trusted origin allowlist
fn actix_allowlist() -> Cors {
    Cors::default()
        .allowed_origin("https://app.example.com")
        .allowed_origin("https://admin.example.com")
}

// ok: auth.rust.cors.permissive -- tower-http: single explicit origin
fn tower_single_origin() -> CorsLayer {
    CorsLayer::new().allow_origin("https://app.example.com".parse().unwrap())
}

// ok: auth.rust.cors.permissive -- tower-http: explicit list of origins
fn tower_origin_list() -> CorsLayer {
    CorsLayer::new().allow_origin([
        "https://app.example.com".parse().unwrap(),
        "https://admin.example.com".parse().unwrap(),
    ])
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.cors.permissive -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/actix-cors/latest/actix_cors/struct.Cors.html#method.permissive
- https://docs.rs/tower-http/latest/tower_http/cors/struct.CorsLayer.html
- https://cwe.mitre.org/data/definitions/942.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
