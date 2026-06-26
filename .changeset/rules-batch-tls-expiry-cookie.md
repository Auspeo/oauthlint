---
"oauthlint-rules": patch
---

feat(rules): add 4 rules for common AI-generated auth mistakes

- `auth.tls.reject-unauthorized` (JS/TS, CWE-295) — disabling Node TLS certificate
  validation (`rejectUnauthorized: false` / `NODE_TLS_REJECT_UNAUTHORIZED=0`).
- `auth.jwt.ignore-expiration` (JS/TS, CWE-613) — `jwt.verify(…, { ignoreExpiration: true })`.
- `auth.cookie.samesite-none-insecure` (JS/TS, CWE-1275) — `SameSite=None` cookie without `Secure`.
- `auth.py.jwt.no-expiration` (Python/PyJWT, CWE-613) — `options={"verify_exp": False}`.
