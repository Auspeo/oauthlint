# `auth.py.jwt.no-algorithms`

> A JWT is decoded with a verification key but WITHOUT an explicit

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-JWT-004` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | python |
| **Technologies** | pyjwt |

## Why this matters

A JWT is decoded with a verification key but WITHOUT an explicit
`algorithms` allowlist. Without pinning the accepted algorithms, PyJWT
may accept a token signed with an unexpected algorithm, enabling
algorithm-confusion attacks (e.g. an RS256 verifier tricked into
treating an attacker-supplied HS256 token as valid by using the public
key as an HMAC secret).

Always pass an explicit allowlist: `jwt.decode(token, key,
algorithms=["RS256"])` (or the exact algorithm you expect). List only the
algorithms your application actually uses.

## ❌ Vulnerable

```python
import jwt


def verify_no_algorithms(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key)


def verify_with_audience(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key, audience="my-api")


def verify_with_issuer_and_audience(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key, audience="my-api", issuer="https://issuer.example")


def verify_with_leeway(token: str, key: str):
    # ruleid: auth.py.jwt.no-algorithms
    return jwt.decode(token, key, leeway=10)
```

## ✅ Safe

```python
import jwt


# ok: auth.py.jwt.no-algorithms -- explicit algorithms allowlist
def verify_with_algorithms(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"])


# ok: auth.py.jwt.no-algorithms -- allowlist alongside other options
def verify_with_algorithms_and_audience(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"], audience="my-api")


# ok: auth.py.jwt.no-algorithms -- single-arg decode is not a verification (and is covered by no-verify)
def decode_single_arg(token: str):
    return jwt.decode(token)


# ok: auth.py.jwt.no-algorithms -- signature disabled is reported by auth.py.jwt.no-verify, not here
def decode_verify_disabled(token: str, key: str):
    return jwt.decode(token, key, options={"verify_signature": False})


# ok: auth.py.jwt.no-algorithms -- encoding is not affected by the algorithms allowlist rule
def issue_token(claims: dict, key: str):
    return jwt.encode(claims, key, algorithm="RS256")
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.jwt.no-algorithms -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pyjwt.readthedocs.io/en/stable/api.html#jwt.decode
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
