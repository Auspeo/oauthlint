use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

// ok: auth.rust.jwt.algorithm-confusion -- single asymmetric family
fn decode_rsa_only(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::RS256);
    validation.algorithms = vec![Algorithm::RS256];
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.algorithm-confusion -- single HMAC family
fn decode_hmac_only(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.algorithms = vec![Algorithm::HS256];
    decode::<Claims>(token, key, &validation).unwrap().claims
}

// ok: auth.rust.jwt.algorithm-confusion -- multiple asymmetric variants, no HMAC
fn decode_asymmetric_multi(token: &str, key: &DecodingKey) -> Claims {
    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_algorithms(vec![Algorithm::RS256, Algorithm::ES256]);
    decode::<Claims>(token, key, &validation).unwrap().claims
}
