---
'oauthlint-rules': minor
---

feat(rules): add `auth.go.jwt.unchecked-method` (AUTH-GO-JWT-004). Flags a
golang-jwt `Keyfunc` passed to `jwt.Parse`/`jwt.ParseWithClaims` that returns
the verification key without first checking `token.Method` (the signing
algorithm). Skipping this check enables an algorithm-confusion attack: a server
that verifies RS256 tokens with an RSA public key will accept an HS256 token
forged with that public key used as the HMAC secret, bypassing authentication
(CWE-347, OWASP API2:2023). A keyfunc that asserts the method first
(`t.Method.(*jwt.SigningMethodHMAC)` or a comparison such as
`t.Method != jwt.SigningMethodHS256`) before returning the key is not flagged.
