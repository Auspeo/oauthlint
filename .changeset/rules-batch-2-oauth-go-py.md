---
"oauthlint-rules": patch
---

feat(rules): add 3 rules — OAuth tokens in web storage, Go skipped claims, Flask-CORS

- `auth.oauth.token-in-localstorage` (JS/TS, CWE-922) — OAuth/OIDC tokens stored in
  localStorage/sessionStorage (XSS-exfiltratable).
- `auth.go.jwt.skip-claims-validation` (Go/golang-jwt, CWE-613) — parsing with
  `jwt.WithoutClaimsValidation()` (skips expiry/claims checks).
- `auth.py.cors.allow-all` (Python/Flask-CORS, CWE-942) — wildcard origin together
  with `supports_credentials=True`.
