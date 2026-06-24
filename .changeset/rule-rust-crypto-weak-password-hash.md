---
'oauthlint-rules': minor
---

Add `auth.rust.crypto.weak-password-hash` (AUTH-RUST-CRYPTO-001, CWE-916).
Flags passwords hashed with a fast, general-purpose digest in Rust — MD5 via
the `md5` crate (`md5::compute(password)`) or SHA-1/SHA-256/SHA-512 via the
RustCrypto `sha1`/`sha2` crates (`Sha256::digest(password.as_bytes())`,
including the streaming `hasher.update(password)` form). Fast digests make
offline brute-force and rainbow-table attacks cheap and are unsuitable for
password storage. The rule is anchored to the "password" character of the
hashed argument (metavariable-regex), so file checksums such as
`Sha256::digest(file_bytes)` are not flagged, and proper password hashers
(`argon2`, `bcrypt`, `scrypt`) are recommended instead.
