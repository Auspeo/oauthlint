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
