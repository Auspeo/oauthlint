use std::collections::HashMap;

// Non-constant-time comparison of secret-shaped values. Each `==` / `!=`
// short-circuits on the first differing byte and leaks the matching prefix
// length over the wire.

fn check_token(provided_token: &str, expected_token: &str) -> bool {
    // ruleid: auth.rust.flow.timing-unsafe-compare
    provided_token == expected_token
}

fn verify_hmac(hmac: &[u8], computed_hmac: &[u8]) -> bool {
    // ruleid: auth.rust.flow.timing-unsafe-compare
    if hmac != computed_hmac {
        return false;
    }
    true
}

fn login(password: &str, stored_password: &str) -> bool {
    // ruleid: auth.rust.flow.timing-unsafe-compare
    password == stored_password
}

fn check_signature(signature: &str, db: &HashMap<String, String>) -> bool {
    let known = db.get("sig").cloned().unwrap_or_default();
    // ruleid: auth.rust.flow.timing-unsafe-compare
    signature == known
}
