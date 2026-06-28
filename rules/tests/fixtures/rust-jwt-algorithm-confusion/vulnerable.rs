use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

// Field assignment mixing an HMAC and an RSA algorithm.
fn decode_field_mixed(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.algorithm-confusion
    validation.algorithms = vec![Algorithm::HS256, Algorithm::RS256];
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// Asymmetric listed first, HMAC second — still confusion.
fn decode_field_mixed_reordered(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::ES256);
    // ruleid: auth.rust.jwt.algorithm-confusion
    validation.algorithms = vec![Algorithm::ES256, Algorithm::HS384];
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// `Validation::new(...)` plus a mixed `set_algorithms` list.
fn decode_set_algorithms_mixed(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS512);
    // ruleid: auth.rust.jwt.algorithm-confusion
    validation.set_algorithms(vec![Algorithm::PS256, Algorithm::HS512]);
    decode::<Claims>(token, key, &validation).unwrap().claims
}
