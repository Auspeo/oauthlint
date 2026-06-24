use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    aud: String,
    exp: usize,
}

fn decode_assignment(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.no-aud-validation
    validation.validate_aud = false;
    decode::<Claims>(token, key, &validation).unwrap().claims
}

fn decode_assignment_default(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::default();
    // ruleid: auth.rust.jwt.no-aud-validation
    validation.validate_aud = false;
    decode::<Claims>(token, key, &validation).unwrap().claims
}
