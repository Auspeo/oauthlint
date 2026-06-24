use argon2::password_hash::{rand_core::OsRng, PasswordHasher, SaltString};
use argon2::Argon2;
use sha2::{Digest, Sha256};

fn hash_with_argon2(password: &str) -> String {
    let salt = SaltString::generate(&mut OsRng);
    // ok: auth.rust.crypto.weak-password-hash
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .unwrap();
    hash.to_string()
}

fn hash_with_bcrypt(password: &str) -> String {
    // ok: auth.rust.crypto.weak-password-hash
    bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap()
}

fn checksum_file(file_bytes: &[u8]) -> Vec<u8> {
    // ok: auth.rust.crypto.weak-password-hash
    Sha256::digest(file_bytes).to_vec()
}

fn checksum_stream(file_contents: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    // ok: auth.rust.crypto.weak-password-hash
    hasher.update(file_contents);
    hasher.finalize().to_vec()
}
