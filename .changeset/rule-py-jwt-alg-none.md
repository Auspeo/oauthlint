---
'oauthlint-rules': minor
---

Add `auth.py.jwt.alg-none` (AUTH-PY-JWT-002, CWE-347). Flags PyJWT calls that
accept or issue tokens with the `none` algorithm — `jwt.decode(...,
algorithms=[..., "none", ...])` and `jwt.encode(..., algorithm="none")` —
where the token is not cryptographically signed, allowing an attacker to forge
arbitrary claims (authentication bypass). Pin a strong algorithm instead:
`algorithms=["RS256"]` / `algorithm="HS256"`. Scoped to the `jwt.` alias with a
case-insensitive match on `none`/`None`/`NONE`; strong algs like RS256, ES256,
and HS256 are not matched.
