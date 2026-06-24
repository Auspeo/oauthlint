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
