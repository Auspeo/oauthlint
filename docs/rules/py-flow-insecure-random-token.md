# `auth.py.flow.insecure-random-token`

> A security-sensitive value (token, secret, password, OTP, nonce, API key,

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-FLOW-004` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-330](https://cwe.mitre.org/data/definitions/330.html) |
| **OWASP** | A02:2021 |
| **Languages** | python |
| **Technologies** | random |

## Why this matters

A security-sensitive value (token, secret, password, OTP, nonce, API key,
reset/verification code) is being generated with the `random` module.
`random` is a pseudo-random number generator seeded from predictable state
and is NOT cryptographically secure — its output can be predicted or
reproduced by an attacker, defeating the secret entirely.

Use the `secrets` module or `os.urandom` instead:
`secrets.token_urlsafe(32)`, `secrets.token_hex(16)`,
`secrets.choice(alphabet)`, or `os.urandom(32)`. These draw from the
operating system's CSPRNG.

## ❌ Vulnerable

```python
import random
import string


def make_session_token():
    # ruleid: auth.py.flow.insecure-random-token
    session_token = random.getrandbits(256)
    return session_token


def make_otp():
    # ruleid: auth.py.flow.insecure-random-token
    otp = random.randint(100000, 999999)
    return otp


def make_password():
    alphabet = string.ascii_letters + string.digits
    # ruleid: auth.py.flow.insecure-random-token
    password = "".join(random.choice(alphabet) for _ in range(16))
    return password


def make_api_key():
    alphabet = string.ascii_letters + string.digits
    # ruleid: auth.py.flow.insecure-random-token
    api_key = "".join(random.choices(alphabet, k=32))
    return api_key


def make_reset_secret():
    # ruleid: auth.py.flow.insecure-random-token
    reset_secret = random.random()
    return reset_secret
```

## ✅ Safe

```python
import os
import random
import secrets
import string


# ok: auth.py.flow.insecure-random-token -- CSPRNG via secrets.token_urlsafe
def make_session_token():
    session_token = secrets.token_urlsafe(32)
    return session_token


# ok: auth.py.flow.insecure-random-token -- CSPRNG via os.urandom
def make_api_key():
    api_key = os.urandom(32).hex()
    return api_key


# ok: auth.py.flow.insecure-random-token -- CSPRNG via secrets.choice
def make_password():
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for _ in range(16))
    return password


# ok: auth.py.flow.insecure-random-token -- non-security use of random (jitter)
def retry_delay():
    delay = random.random()
    return delay


# ok: auth.py.flow.insecure-random-token -- non-security use of random (sampling)
def pick_color():
    color = random.choice(["red", "green", "blue"])
    return color
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.flow.insecure-random-token -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.python.org/3/library/secrets.html
- https://cwe.mitre.org/data/definitions/330.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
