---
'oauthlint-rules': minor
---

Add `auth.rust.jwt.hardcoded-secret` (AUTH-RUST-JWT-002, CWE-798). Flags
jsonwebtoken HMAC keys that are hardcoded as literals in
`EncodingKey::from_secret` / `DecodingKey::from_secret`: a byte-string literal
`b"..."` or a string literal coerced with `"...".as_ref()` / `"...".as_bytes()`.
Anyone who can read the source or git history can forge or tamper with tokens,
an authentication bypass. Load the secret at runtime from the environment or a
secret manager instead. The literal must sit in key position, so
`from_secret(secret.as_bytes())` (a variable) and
`from_secret(std::env::var("JWT_SECRET")?.as_bytes())` are not matched.
