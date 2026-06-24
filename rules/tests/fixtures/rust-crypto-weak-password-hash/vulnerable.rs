use md5;
use sha1::Sha1;
use sha2::{Digest, Sha256, Sha512};

fn hash_md5(password: &str) -> String {
    // ruleid: auth.rust.crypto.weak-password-hash
    let digest = md5::compute(password);
    format!("{:x}", digest)
}

fn hash_sha1(password: &[u8]) -> Vec<u8> {
    // ruleid: auth.rust.crypto.weak-password-hash
    Sha1::digest(password).to_vec()
}

fn hash_sha256(password: &str) -> Vec<u8> {
    // ruleid: auth.rust.crypto.weak-password-hash
    Sha256::digest(password.as_bytes()).to_vec()
}

fn hash_sha512_streaming(passwd: &[u8]) -> Vec<u8> {
    let mut hasher = Sha512::new();
    // ruleid: auth.rust.crypto.weak-password-hash
    hasher.update(passwd);
    hasher.finalize().to_vec()
}
