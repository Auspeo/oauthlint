---
'oauthlint-rules': minor
---

Add `auth.go.cookie.insecure` (AUTH-GO-COOKIE-001): flags session/auth
`http.Cookie` values created with a security attribute explicitly disabled —
`http.Cookie{..., Secure: false, ...}` and `http.Cookie{..., HttpOnly: false, ...}`.
With `Secure: false` the cookie travels over plain HTTP; with `HttpOnly: false`
it is readable from JavaScript — either way the session/token cookie can be
stolen (CWE-614, OWASP A05:2021). Only the literal `false` is matched;
`Secure: true`, `HttpOnly: true`, and the absence of the field are not flagged.
Works for both `http.Cookie{...}` and `&http.Cookie{...}`.
