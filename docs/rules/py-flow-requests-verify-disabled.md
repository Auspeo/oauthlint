# `auth.py.flow.requests-verify-disabled`

> A `requests` call disables TLS certificate verification with

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-FLOW-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-295](https://cwe.mitre.org/data/definitions/295.html) |
| **OWASP** | API8:2023 |
| **Languages** | python |
| **Technologies** | requests |

## Why this matters

A `requests` call disables TLS certificate verification with
`verify=False`. This silences the validation of the server's
certificate, so an attacker who can intercept the connection can
present any certificate and read or tamper with the traffic — a
classic man-in-the-middle exposure. For OAuth/OIDC this leaks
authorization codes, access tokens and client secrets.

Never set `verify=False`. Leave verification on (the default) so the
system CA bundle is used. In development against a private CA, point
`verify` at the CA bundle instead, e.g.
`requests.get(url, verify="/path/to/ca-bundle.pem")` or set the
`REQUESTS_CA_BUNDLE` env var (certifi).

## ❌ Vulnerable

```python
import requests


def fetch_token(url: str):
    # ruleid: auth.py.flow.requests-verify-disabled
    return requests.get(url, verify=False)


def post_credentials(url: str, data: dict):
    # ruleid: auth.py.flow.requests-verify-disabled
    return requests.post(url, data=data, verify=False, timeout=10)


def exchange_via_session(url: str, payload: dict):
    session = requests.Session()
    # ruleid: auth.py.flow.requests-verify-disabled
    return session.get(url, params=payload, verify=False)


def generic_request(url: str):
    # ruleid: auth.py.flow.requests-verify-disabled
    return requests.request("GET", url, verify=False)


def session_post(session, url: str, body: dict):
    # ruleid: auth.py.flow.requests-verify-disabled
    return session.post(url, json=body, verify=False)
```

## ✅ Safe

```python
import requests


def fetch_token(url: str):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.get(url)


def fetch_token_explicit(url: str):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.get(url, verify=True)


def post_with_custom_ca(url: str, data: dict):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.post(url, data=data, verify="/etc/ssl/ca.pem")


def exchange_via_session(url: str, payload: dict):
    session = requests.Session()
    # ok: auth.py.flow.requests-verify-disabled
    return session.get(url, params=payload, verify="/etc/ssl/certs/ca-bundle.crt")


def generic_request(url: str):
    # ok: auth.py.flow.requests-verify-disabled
    return requests.request("GET", url, verify=True)
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.flow.requests-verify-disabled -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification
- https://cwe.mitre.org/data/definitions/295.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
