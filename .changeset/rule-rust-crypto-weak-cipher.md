---
'oauthlint-rules': minor
---

Add `auth.rust.crypto.weak-cipher` (AUTH-RUST-CRYPTO-003, CWE-327). Flags use
of broken or deprecated RustCrypto ciphers to protect sensitive data: DES
(`Des::new`, crate `des`), 3DES (`TdesEde3::new` / `TdesEde2::new`), and RC4
(`Rc4::new`, crate `rc4`). These have 64-bit blocks (Sweet32) or known
keystream biases (RFC 7465) and leave tokens and secrets inadequately
protected. Use an authenticated AEAD cipher instead — AES-GCM
(`Aes256Gcm::new`, crate `aes-gcm`) or ChaCha20-Poly1305
(`ChaCha20Poly1305::new`); modern AEAD constructors are not flagged.
