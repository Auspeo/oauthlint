use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    iss: String,
    exp: usize,
}

fn decode_new(token: &str, key: &DecodingKey) -> Claims {
    // ruleid: auth.rust.jwt.no-issuer-validation
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["my-api"]);
    decode::<Claims>(token, key, &validation).unwrap().claims
}

fn decode_default(token: &str, key: &DecodingKey) -> Claims {
    // ruleid: auth.rust.jwt.no-issuer-validation
    let mut validation = Validation::default();
    decode::<Claims>(token, key, &validation).unwrap().claims
}
