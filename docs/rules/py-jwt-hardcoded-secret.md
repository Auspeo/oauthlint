# `auth.py.jwt.hardcoded-secret`

> A JWT signing/verification key is hardcoded as a string literal in the

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-JWT-003` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API2:2023 |
| **Languages** | python |
| **Technologies** | pyjwt |

## Why this matters

A JWT signing/verification key is hardcoded as a string literal in the
call to PyJWT. Anyone who can read the source or git history can forge or
tamper with tokens, which is a complete authentication bypass.

Load the secret from the environment or a secret manager instead, e.g.
`key = os.environ["JWT_SECRET"]` and `jwt.encode(payload, key, ...)`.
Never commit signing keys to source control.

## ❌ Vulnerable

```python
import jwt


def sign(payload: dict):
    # ruleid: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, "super-secret-key")


def sign_with_alg(payload: dict):
    # ruleid: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, "super-secret-key", algorithm="HS256")


def verify(token: str):
    # ruleid: auth.py.jwt.hardcoded-secret
    return jwt.decode(token, "super-secret-key", algorithms=["HS256"])
```

## ✅ Safe

```python
import os

import jwt
from django.conf import settings


def sign_from_env(payload: dict):
    # ok: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")


def sign_from_settings(payload: dict):
    # ok: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def verify_with_variable(token: str):
    key = os.environ["JWT_SECRET"]
    # ok: auth.py.jwt.hardcoded-secret
    return jwt.decode(token, key, algorithms=["HS256"])
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.jwt.hardcoded-secret -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pyjwt.readthedocs.io/en/stable/api.html#jwt.encode
- https://cwe.mitre.org/data/definitions/798.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
