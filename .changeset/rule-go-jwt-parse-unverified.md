---
'oauthlint-rules': minor
---

Add `auth.go.jwt.parse-unverified` (AUTH-GO-JWT-002, CWE-347). Flags golang-jwt
calls that decode a token with `ParseUnverified` — `parser.ParseUnverified(...)`,
`jwt.NewParser().ParseUnverified(...)`, `new(jwt.Parser).ParseUnverified(...)` —
which parse the JWT without checking its signature, so any claims read from the
result are attacker-controlled (authentication bypass). Verify instead with
`jwt.Parse(tok, keyfunc)` or `jwt.ParseWithClaims(tok, claims, keyfunc)`. The
signature-verifying `jwt.Parse` / `jwt.ParseWithClaims` calls are not matched.
