use jsonwebtoken::{Algorithm, Validation};

fn build_validation_assign() -> Validation {
    let mut validation = Validation::new(Algorithm::HS256);
    // ruleid: auth.rust.jwt.no-expiration-validation
    validation.validate_exp = false;
    validation
}

fn build_validation_assign_default() -> Validation {
    let mut v = Validation::default();
    // ruleid: auth.rust.jwt.no-expiration-validation
    v.validate_exp = false;
    v
}
