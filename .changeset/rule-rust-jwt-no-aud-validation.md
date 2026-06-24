---
'oauthlint-rules': minor
---

feat(rules): add `auth.rust.jwt.no-aud-validation` (`AUTH-RUST-JWT-004`).
Flags JWT audience validation being disabled via `validate_aud: false` (struct
literal) or `$V.validate_aud = false` on a `jsonwebtoken` `Validation`. Without
an audience check, a token minted for another service can be replayed against
this API. Keep `validate_aud` at `true` and set the expected audience with
`validation.set_audience(...)` (CWE-287, OWASP API2:2023).
