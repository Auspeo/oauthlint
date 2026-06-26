use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    iss: String,
    exp: usize,
}

// ok: auth.rust.jwt.no-issuer-validation -- issuer pinned via set_issuer
fn decode_with_issuer(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&["https://issuer.example.com"]);
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.no-issuer-validation -- issuer pinned via the iss field
fn decode_with_iss_field(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.iss = Some(["https://issuer.example.com".to_string()].into_iter().collect());
    decode::<Claims>(token, key, &validation).unwrap().claims
}
