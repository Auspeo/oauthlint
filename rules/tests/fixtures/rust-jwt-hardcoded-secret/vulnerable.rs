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
