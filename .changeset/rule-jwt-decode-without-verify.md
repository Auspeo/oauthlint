---
'oauthlint-rules': minor
---

Add `auth.jwt.decode-without-verify` (AUTH-JWT-009, CWE-347). Flags
`jwt.decode(...)` from `jsonwebtoken`, which parses a token without verifying
its signature — trusting the returned claims is an authentication bypass. Use
`jwt.verify(token, secret)` instead. Scoped to the `jwt` alias and the
destructured `decode` import; `jwt.verify(...)`, `jose.decodeJwt`, and unrelated
`decode()` calls are not matched.
