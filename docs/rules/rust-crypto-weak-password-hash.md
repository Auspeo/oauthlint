# `auth.rust.crypto.weak-password-hash`

> A password is being hashed with a fast, general-purpose digest (MD5 via

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-CRYPTO-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | rust |
| **Technologies** | sha2, md5 |

## Why this matters

A password is being hashed with a fast, general-purpose digest (MD5 via
the `md5` crate, or SHA-1/SHA-256/SHA-512 via the RustCrypto `sha1`/`sha2`
crates). These algorithms are designed to be fast, which makes offline
brute-force and rainbow-table attacks cheap — they are NOT suitable for
storing passwords (CWE-916).

Use a dedicated, slow password-hashing function with a per-password salt
and a tunable work factor: Argon2 (`argon2` crate,
`Argon2::default().hash_password(...)`), bcrypt (`bcrypt::hash(...)`), or
scrypt (`scrypt` crate). These resist brute-force by design.

## ❌ Vulnerable

```rust
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
```

## ✅ Safe

```rust
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
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.crypto.weak-password-hash -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/916.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://docs.rs/argon2/latest/argon2/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
