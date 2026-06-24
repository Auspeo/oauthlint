---
'oauthlint-rules': minor
---

Add `auth.py.jwt.no-algorithms` (AUTH-PY-JWT-004, CWE-347). Flags PyJWT
`jwt.decode(token, key, ...)` calls that verify with a key but omit an explicit
`algorithms` allowlist — without pinning the accepted algorithms, a token signed
with an unexpected algorithm can be accepted, enabling algorithm-confusion
attacks. Always pass `algorithms=["RS256"]` (or the algorithm you expect).
Scoped to the `jwt.` alias; calls that already pin `algorithms`, single-argument
`jwt.decode(token)`, signature-disabled decodes (`verify=False` /
`options={"verify_signature": False}`, covered by `auth.py.jwt.no-verify`), and
`jwt.encode(...)` are not matched.
