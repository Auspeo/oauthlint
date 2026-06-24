---
'oauthlint-rules': minor
---

Add `auth.py.secret.django-hardcoded-key` (AUTH-PY-SECRET-002): flags a Django
`SECRET_KEY` set to a hard-coded string literal at module level —
`SECRET_KEY = "..."`, typically the auto-generated `django-insecure-...` value
committed by mistake. A hard-coded `SECRET_KEY` lets anyone forge session,
CSRF and password-reset tokens and bypass authentication (CWE-798, OWASP
A07:2021). Values loaded from `os.environ`, `env()`, `config()`, or a variable
are not flagged.
