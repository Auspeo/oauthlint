use aes_gcm::aead::KeyInit;
use aes_gcm::Aes256Gcm;
use chacha20poly1305::ChaCha20Poly1305;

fn encrypt_token_aes_gcm(key: &[u8]) -> Aes256Gcm {
    // ok: auth.rust.crypto.weak-cipher
    let cipher = Aes256Gcm::new(key.into());
    cipher
}

fn encrypt_secret_chacha(key: &[u8]) -> ChaCha20Poly1305 {
    // ok: auth.rust.crypto.weak-cipher
    let cipher = ChaCha20Poly1305::new(key.into());
    cipher
}
