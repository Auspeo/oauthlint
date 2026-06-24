# `auth.py.secret.django-hardcoded-key`

> The Django `SECRET_KEY` is set to a hard-coded string literal in

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-SECRET-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | A07:2021 |
| **Languages** | python |
| **Technologies** | django |

## Why this matters

The Django `SECRET_KEY` is set to a hard-coded string literal in
settings. This is typically the auto-generated `django-insecure-...`
value committed by mistake. `SECRET_KEY` signs sessions, CSRF tokens
and password-reset tokens — anyone who reads the source or a leaked
repo can forge them and bypass authentication entirely (CWE-798).

Load it from the environment or a secret manager instead, e.g.
`SECRET_KEY = os.environ["SECRET_KEY"]`, `django-environ`
(`env("SECRET_KEY")`), or `config("SECRET_KEY")`. Generate the value
with a CSPRNG and never commit it.

## ❌ Vulnerable

```python
# Django settings.py

# ruleid: auth.py.secret.django-hardcoded-key
SECRET_KEY = "django-insecure-9v8x2k!q3@w5z#r7t1y4u6i8o0p-abcdefghijklmno"

# ruleid: auth.py.secret.django-hardcoded-key
SECRET_KEY = "my-arbitrary-super-secret-key"

# SECURITY WARNING: keep the secret key used in production secret!
# ruleid: auth.py.secret.django-hardcoded-key
SECRET_KEY = "another-key-with-a-comment-around-it"  # do not share
```

## ✅ Safe

```python
# Django settings.py

import os

import environ
from decouple import config

env = environ.Env()

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = os.environ["SECRET_KEY"]

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = os.environ.get("SECRET_KEY")

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = env("SECRET_KEY")

# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = config("SECRET_KEY")

_loaded_key = os.environ["SECRET_KEY"]
# ok: auth.py.secret.django-hardcoded-key
SECRET_KEY = _loaded_key
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.secret.django-hardcoded-key -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.djangoproject.com/en/stable/ref/settings/#secret-key
- https://cwe.mitre.org/data/definitions/798.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
