# `auth.py.flow.weak-password-hash`

> A password is being hashed with a fast, general-purpose digest from

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-FLOW-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | python |
| **Technologies** | hashlib |

## Why this matters

A password is being hashed with a fast, general-purpose digest from
`hashlib` (MD5, SHA-1, SHA-256, SHA-512). These algorithms are designed
to be fast, which makes offline brute-force and rainbow-table attacks
cheap — they are NOT suitable for storing passwords.

Use a dedicated, slow password-hashing function with a per-password salt
and a tunable work factor: `bcrypt` (`bcrypt.hashpw`), `argon2`
(`argon2.PasswordHasher().hash`), `scrypt`, or a wrapper such as
`passlib`. These resist brute-force by design.

## ❌ Vulnerable

```python
import hashlib


def hash_md5(password: str) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.md5(password.encode()).hexdigest()


def hash_sha1(passwd: str) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.sha1(passwd.encode("utf-8")).hexdigest()


def hash_sha256(user_password: bytes) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.sha256(user_password).hexdigest()


def hash_sha512(pwd: str) -> str:
    # ruleid: auth.py.flow.weak-password-hash
    return hashlib.sha512(pwd.encode()).hexdigest()


def hash_update_form(password: str) -> str:
    h = hashlib.sha256()
    # ruleid: auth.py.flow.weak-password-hash
    h.update(password.encode())
    return h.hexdigest()
```

## ✅ Safe

```python
import hashlib
import hmac

import bcrypt
from argon2 import PasswordHasher
from passlib.hash import argon2 as passlib_argon2


def hash_with_bcrypt(password: str) -> bytes:
    # ok: auth.py.flow.weak-password-hash
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def hash_with_argon2(password: str) -> str:
    ph = PasswordHasher()
    # ok: auth.py.flow.weak-password-hash
    return ph.hash(password)


def hash_with_passlib(password: str) -> str:
    # ok: auth.py.flow.weak-password-hash
    return passlib_argon2.hash(password)


def hash_with_scrypt(password: str, salt: bytes) -> bytes:
    # ok: auth.py.flow.weak-password-hash
    return hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)


def checksum_file(file_bytes: bytes) -> str:
    # ok: auth.py.flow.weak-password-hash
    return hashlib.sha256(file_bytes).hexdigest()


def content_digest(data: bytes) -> str:
    # ok: auth.py.flow.weak-password-hash
    return hashlib.md5(data).hexdigest()


def sign_message(key: bytes, message: bytes) -> str:
    # ok: auth.py.flow.weak-password-hash
    return hmac.new(key, message, hashlib.sha256).hexdigest()
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.flow.weak-password-hash -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/916.html
- https://argon2-cffi.readthedocs.io/en/stable/
- https://passlib.readthedocs.io/en/stable/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
