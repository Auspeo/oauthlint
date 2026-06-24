# `auth.rust.cookie.insecure`

> A session/auth cookie is built with a security attribute explicitly

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-COOKIE-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-614](https://cwe.mitre.org/data/definitions/614.html) |
| **OWASP** | A05:2021 |
| **Languages** | rust |
| **Technologies** | cookie |

## Why this matters

A session/auth cookie is built with a security attribute explicitly
disabled (`secure(false)` or `http_only(false)`). With `secure(false)`
the cookie is sent over plain HTTP, so a network attacker can read the
session token. With `http_only(false)` the cookie is readable from
JavaScript, so any XSS can steal it. For OAuth/OIDC this exposes session
and token cookies to theft and hijacking.

Set `secure(true)` and `http_only(true)` on auth cookies, and add an
appropriate `SameSite` mode (for example
`same_site(SameSite::Lax)`).

## ❌ Vulnerable

```rust
use cookie::{Cookie, SameSite};

fn session_cookie_insecure() -> Cookie<'static> {
    // ruleid: auth.rust.cookie.insecure
    Cookie::build(("session", "abc123"))
        .secure(false)
        .http_only(true)
        .same_site(SameSite::Lax)
        .build()
}

fn auth_cookie_no_httponly() -> Cookie<'static> {
    // ruleid: auth.rust.cookie.insecure
    Cookie::build(("auth_token", "xyz789"))
        .secure(true)
        .http_only(false)
        .same_site(SameSite::Strict)
        .build()
}

fn id_cookie_inline() -> Cookie<'static> {
    let builder = Cookie::build(("id_token", "tok"));
    // ruleid: auth.rust.cookie.insecure
    builder.secure(false).build()
}
```

## ✅ Safe

```rust
use cookie::{Cookie, SameSite};

fn session_cookie_secure() -> Cookie<'static> {
    // ok: auth.rust.cookie.insecure
    Cookie::build(("session", "abc123"))
        .secure(true)
        .http_only(true)
        .same_site(SameSite::Lax)
        .build()
}

fn auth_cookie_defaults() -> Cookie<'static> {
    // ok: auth.rust.cookie.insecure
    Cookie::build(("auth_token", "xyz789"))
        .same_site(SameSite::Strict)
        .build()
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.cookie.insecure -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.rs/cookie/latest/cookie/struct.CookieBuilder.html
- https://cwe.mitre.org/data/definitions/614.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
