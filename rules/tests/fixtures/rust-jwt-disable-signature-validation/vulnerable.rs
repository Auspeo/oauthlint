use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

fn decode_unverified(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.disable-signature-validation
    validation.insecure_disable_signature_validation();
    decode::<Claims>(token, key, &validation).unwrap().claims
}

fn decode_chained(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::default();
    // ruleid: auth.rust.jwt.disable-signature-validation
    let _ = validation.insecure_disable_signature_validation();
    decode::<Claims>(token, key, &validation).unwrap().claims
}
