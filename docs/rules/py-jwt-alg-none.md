# `auth.py.jwt.alg-none`

> A JWT is decoded or signed with the `none` algorithm. The `none`

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-JWT-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | python |
| **Technologies** | pyjwt |

## Why this matters

A JWT is decoded or signed with the `none` algorithm. The `none`
algorithm means the token is NOT cryptographically signed, so any
attacker can forge a token with arbitrary claims and have it accepted —
a complete authentication bypass (CVE-class JWT alg=none vulnerability).

Never allow `none`. Pin a strong signing algorithm explicitly:
`jwt.decode(token, key, algorithms=["RS256"])` for verification, or
`jwt.encode(claims, key, algorithm="RS256")` (also ES256 / HS256) when
issuing tokens. Never include `"none"` in the `algorithms` allowlist.

## ❌ Vulnerable

```python
import jwt


def decode_none(token: str, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["none"])


def decode_none_case(token: str, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["RS256", "None"])


def decode_none_upper(token: str, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["NONE"])


def encode_none(claims: dict, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.encode(claims, key, algorithm="none")
```

## ✅ Safe

```python
import jwt


def decode_rs256(token: str, key: str):
    # ok: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["RS256"])


def decode_multiple_strong(token: str, key: str):
    # ok: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["RS256", "ES256"])


def encode_hs256(claims: dict, key: str):
    # ok: auth.py.jwt.alg-none
    return jwt.encode(claims, key, algorithm="HS256")
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.jwt.alg-none -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pyjwt.readthedocs.io/en/stable/api.html#jwt.decode
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
