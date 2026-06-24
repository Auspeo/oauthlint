---
'oauthlint-rules': minor
---

feat(rules): add `auth.rust.jwt.disable-signature-validation`
(`AUTH-RUST-JWT-001`). Flags
`Validation::insecure_disable_signature_validation()` from the `jsonwebtoken`
crate, which turns off JWT signature verification and lets `decode` accept
forged tokens (CWE-347, OWASP API2:2023).
