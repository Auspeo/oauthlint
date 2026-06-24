---
'oauthlint-rules': minor
---

feat(rules): add `auth.rust.jwt.no-expiration-validation` (AUTH-RUST-JWT-003).
Flags JWT expiration validation being turned off on the `jsonwebtoken`
`Validation`: a struct literal with `validate_exp: false` and an assignment
`validation.validate_exp = false`. With `exp` checking disabled, `decode`
accepts already-expired tokens, so leaked or stolen access tokens stay usable
forever (CWE-613, OWASP API2:2023). `validate_exp: true`, `= true`, and the
field's absence (default `true`) are not flagged.
