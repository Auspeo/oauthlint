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
