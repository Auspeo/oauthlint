---
'oauthlint-rules': minor
---

Add `auth.rust.cookie.insecure` (AUTH-RUST-COOKIE-001): flags session/auth
cookies built with a security attribute explicitly disabled — `secure(false)`
or `http_only(false)` on a cookie builder (for example
`Cookie::build(...).secure(false)`). With `secure(false)` the cookie travels
over plain HTTP; with `http_only(false)` it is readable from JavaScript —
either way the session/token cookie can be stolen (CWE-614, OWASP A05:2021).
Only the literal `false` is matched; `secure(true)`, `http_only(true)`, and the
absence of the call are not flagged.
