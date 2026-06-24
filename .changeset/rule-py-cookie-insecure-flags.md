---
'oauthlint-rules': minor
---

Add `auth.py.cookie.insecure-flags` (AUTH-PY-COOKIE-001): flags session/auth
cookies issued with a security attribute explicitly disabled —
`response.set_cookie(..., secure=False)`, `response.set_cookie(..., httponly=False)`,
and Django settings `SESSION_COOKIE_SECURE = False`, `CSRF_COOKIE_SECURE = False`,
`SESSION_COOKIE_HTTPONLY = False`. These let auth cookies travel over plain HTTP
or be read by JavaScript, exposing the session token to theft (CWE-614,
OWASP A05:2021). Only the literal `False` is matched; `secure=True`,
`SESSION_COOKIE_SECURE = True`, and the absence of the kwarg are not flagged.
