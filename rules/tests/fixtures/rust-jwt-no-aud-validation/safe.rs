use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    aud: String,
    exp: usize,
}

// ok: auth.rust.jwt.no-aud-validation -- audience explicitly validated
fn decode_with_audience(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_audience(&["my-api"]);
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.no-aud-validation -- default validation keeps validate_aud = true
fn decode_default(token: &str, key: &DecodingKey) -> Claims {
    let validation = Validation::new(Algorithm::HS256);
    decode::<Claims>(token, key, &validation).unwrap().claims
}
