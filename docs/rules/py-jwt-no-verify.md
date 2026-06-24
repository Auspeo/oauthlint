# `auth.py.jwt.no-verify`

> A JWT is decoded with signature verification disabled. PyJWT's

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-JWT-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | python |
| **Technologies** | pyjwt |

## Why this matters

A JWT is decoded with signature verification disabled. PyJWT's
`jwt.decode(token, verify=False)` (legacy) or
`options={"verify_signature": False}` parses the token WITHOUT checking
the signature, so any attacker-forged token is accepted — a complete
authentication bypass.

Always verify: `jwt.decode(token, key, algorithms=["RS256"])`. If you
only need to read an unverified header (e.g. the `kid` before fetching
the key), use `jwt.get_unverified_header(token)` and treat the claims
as untrusted.

## ❌ Vulnerable

```python
import jwt


def read_legacy(token: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, verify=False)


def read_legacy_with_key(token: str, key: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, key, algorithms=["HS256"], verify=False)


def read_options(token: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, options={"verify_signature": False})


def read_options_mixed(token: str, key: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, key, options={"verify_aud": False, "verify_signature": False})
```

## ✅ Safe

```python
import jwt


# ok: auth.py.jwt.no-verify -- signature verified with an explicit algorithm
def read_verified(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"])


# ok: auth.py.jwt.no-verify -- verification on, only audience check disabled
def read_partial(token: str, key: str):
    return jwt.decode(token, key, algorithms=["HS256"], options={"verify_aud": False})


# ok: auth.py.jwt.no-verify -- reading the unverified header is the supported safe API
def read_header(token: str):
    return jwt.get_unverified_header(token)
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.jwt.no-verify -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pyjwt.readthedocs.io/en/stable/api.html#jwt.decode
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
