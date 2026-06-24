---
'oauthlint-rules': minor
---

Add `auth.py.jwt.hardcoded-secret` (AUTH-PY-JWT-003, CWE-798). Flags PyJWT
`jwt.encode(payload, "literal", ...)` and `jwt.decode(token, "literal", ...)`
calls where the signing/verification key is a hardcoded string literal — anyone
who can read the source or git history can forge tokens, an authentication
bypass. Load the key from `os.environ` or a secret manager instead. A
`metavariable-regex` requires the key argument to be a quoted string literal, so
`os.environ["JWT_SECRET"]`, `settings.SECRET_KEY`, and plain variables are not
matched.
