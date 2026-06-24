---
'oauthlint-rules': minor
---

Add `auth.java.crypto.weak-password-hash` (AUTH-JAVA-CRYPTO-001, CWE-916).
Flags passwords hashed with a fast JCA `MessageDigest` (MD5, SHA-1, SHA-256,
SHA-512) — e.g. `md.digest(password.getBytes())` / `md.update(pwd...)` where a
weak `MessageDigest.getInstance(...)` is instantiated in the same method. Fast
general-purpose digests make offline brute-force and rainbow-table attacks
cheap and are unsuitable for password storage. The rule is anchored to the
"password" character of the digested argument (metavariable-regex), so file
checksums and non-password fingerprints such as
`MessageDigest.getInstance("SHA-256").digest(fileBytes)` are not flagged, and
proper password hashers (`BCryptPasswordEncoder`, `Argon2PasswordEncoder`,
PBKDF2) are recommended instead.
