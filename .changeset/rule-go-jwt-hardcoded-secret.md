---
'oauthlint-rules': minor
---

Add `auth.go.jwt.hardcoded-secret` (AUTH-GO-JWT-003, CWE-798). Flags golang-jwt
HMAC keys that are hardcoded as string literals: `token.SignedString([]byte("literal"))`
and a `Keyfunc` (`func(...) (interface{}, error)`) that returns
`[]byte("literal"), nil`. Anyone who can read the source or git history can
forge tokens, an authentication bypass. Load the key from the environment or a
secret manager instead. The `"..."` literal must sit in key position, so
`[]byte(os.Getenv("JWT_SECRET"))` and `[]byte(secret)` (a variable) are not
matched.
