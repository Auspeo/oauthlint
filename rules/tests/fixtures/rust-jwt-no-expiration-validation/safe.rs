use jsonwebtoken::{Algorithm, Validation};

fn build_validation_default() -> Validation {
    // ok: auth.rust.jwt.no-expiration-validation
    Validation::new(Algorithm::HS256)
}

fn build_validation_literal() -> Validation {
    // ok: auth.rust.jwt.no-expiration-validation
    Validation {
        algorithms: vec![Algorithm::HS256],
        validate_exp: true,
        ..Default::default()
    }
}

fn build_validation_assign() -> Validation {
    let mut validation = Validation::new(Algorithm::HS256);
    // ok: auth.rust.jwt.no-expiration-validation
    validation.validate_exp = true;
    validation
}
