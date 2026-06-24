---
'oauthlint-rules': minor
---

Add `auth.go.jwt.none-algorithm` (AUTH-GO-JWT-001, CWE-347). Flags use of the
golang-jwt `none` algorithm, which produces an unsigned, forgeable token — a
complete authentication bypass. Matches `jwt.SigningMethodNone` (e.g. via
`jwt.NewWithClaims(jwt.SigningMethodNone, ...)`) and the
`jwt.UnsafeAllowNoneSignatureType` sentinel passed to `SignedString`. Sign with
`jwt.SigningMethodHS256`/`RS256`/`ES256` instead; those real algorithms are not
flagged.
