use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

// ok: auth.rust.jwt.disable-signature-validation -- expected algorithm, signature verified
fn decode_verified(token: &str, key: &DecodingKey) -> Claims {
    let validation = Validation::new(Algorithm::HS256);
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.disable-signature-validation -- default validation, signature still checked
fn decode_default(token: &str, key: &DecodingKey) -> Claims {
    let validation = Validation::default();
    decode::<Claims>(token, key, &validation).unwrap().claims
}
