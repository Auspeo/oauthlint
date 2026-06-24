# `auth.py.cookie.insecure-flags`

> A session/auth cookie is issued with a security attribute explicitly

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-COOKIE-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-614](https://cwe.mitre.org/data/definitions/614.html) |
| **OWASP** | A05:2021 |
| **Languages** | python |
| **Technologies** | flask, django |

## Why this matters

A session/auth cookie is issued with a security attribute explicitly
disabled. `secure=False` lets the cookie travel over plain HTTP (it can be
sniffed on the wire), and `httponly=False` exposes it to JavaScript so an
XSS payload can read and exfiltrate it — either way the session token is
at risk of theft (CWE-614, OWASP A05:2021). The same applies to Django's
`SESSION_COOKIE_SECURE = False`, `CSRF_COOKIE_SECURE = False`, and
`SESSION_COOKIE_HTTPONLY = False` settings.

Always set Secure + HttpOnly (and ideally `SameSite`) on auth cookies,
e.g. `response.set_cookie("session", token, secure=True, httponly=True,
samesite="Lax")` or, in Django settings, `SESSION_COOKIE_SECURE = True`
and `SESSION_COOKIE_HTTPONLY = True`.

## ❌ Vulnerable

```python
from django.http import HttpResponse


def set_insecure_secure(response: HttpResponse, token: str):
    # ruleid: auth.py.cookie.insecure-flags
    response.set_cookie("session", token, secure=False, httponly=True)


def set_insecure_httponly(response: HttpResponse, token: str):
    # ruleid: auth.py.cookie.insecure-flags
    response.set_cookie("session", token, secure=True, httponly=False)


# Django settings module
# ruleid: auth.py.cookie.insecure-flags
SESSION_COOKIE_SECURE = False

# ruleid: auth.py.cookie.insecure-flags
CSRF_COOKIE_SECURE = False

# ruleid: auth.py.cookie.insecure-flags
SESSION_COOKIE_HTTPONLY = False
```

## ✅ Safe

```python
from django.http import HttpResponse


# ok: auth.py.cookie.insecure-flags -- Secure + HttpOnly + SameSite all set
def set_secure_cookie(response: HttpResponse, token: str):
    response.set_cookie("session", token, secure=True, httponly=True, samesite="Lax")


# ok: auth.py.cookie.insecure-flags -- no security kwargs given; framework defaults apply
def set_cookie_no_flags(response: HttpResponse, value: str):
    response.set_cookie("prefs", value)


# ok: auth.py.cookie.insecure-flags -- Django settings hardened
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.cookie.insecure-flags -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.djangoproject.com/en/stable/ref/settings/#session-cookie-secure
- https://flask.palletsprojects.com/en/stable/api/#flask.Response.set_cookie
- https://cwe.mitre.org/data/definitions/614.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
