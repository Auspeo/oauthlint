# `auth.rust.crypto.weak-cipher`

> A broken or deprecated cipher from the RustCrypto ecosystem is used to

| | |
|---|---|
| **OAuthLint id** | `AUTH-RUST-CRYPTO-003` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) |
| **OWASP** | A02:2021 |
| **Languages** | rust |
| **Technologies** | des, rc4 |

## Why this matters

A broken or deprecated cipher from the RustCrypto ecosystem is used to
protect data. DES (`Des::new`, crate `des`) and 3DES (`TdesEde3::new` /
`TdesEde2::new`) have a 64-bit block and are considered insecure
(Sweet32, brute-force), while RC4 (`Rc4::new`, crate `rc4`) has
well-known keystream biases and is forbidden by RFC 7465. For OAuth/OIDC
this means tokens, client secrets, and other sensitive material are not
adequately protected and may be recovered by an attacker.

Use an authenticated AEAD cipher instead: AES-GCM via the `aes-gcm`
crate (`Aes256Gcm::new(key)`) or ChaCha20-Poly1305
(`ChaCha20Poly1305::new(key)`), both of which provide confidentiality
and integrity.

## ❌ Vulnerable

```rust
use des::cipher::{BlockEncrypt, KeyInit};
use des::{Des, TdesEde3};
use rc4::{KeyInit as Rc4KeyInit, Rc4, StreamCipher};

fn encrypt_token_des(key: &[u8]) -> impl BlockEncrypt {
    // ruleid: auth.rust.crypto.weak-cipher
    let cipher = Des::new(key.into());
    cipher
}

fn encrypt_secret_3des(key: &[u8]) -> impl BlockEncrypt {
    // ruleid: auth.rust.crypto.weak-cipher
    let cipher = TdesEde3::new(key.into());
    cipher
}

fn encrypt_token_rc4(key: &[u8]) -> impl StreamCipher {
    // ruleid: auth.rust.crypto.weak-cipher
    let cipher = Rc4::new(key.into());
    cipher
}
```

## ✅ Safe

```rust
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
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.rust.crypto.weak-cipher -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/327.html
- https://docs.rs/aes-gcm/latest/aes_gcm/
- https://datatracker.ietf.org/doc/html/rfc7465

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
