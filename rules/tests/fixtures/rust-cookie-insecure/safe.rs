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
