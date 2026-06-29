---
"oauthlint-rules": minor
---

feat(rules): six new Python OAuth/OIDC/JWT rules

Ports of the JS/TS OAuth and JWT rules to Python, plus two Python-native rules:

- `auth.py.oauth.ropc-grant` (AUTH-PY-OAUTH-001, CWE-522): flags the Resource
  Owner Password Credentials grant (`grant_type=password`) in a `requests` /
  `httpx` / `urllib` body or an OAuth client call — forbidden by RFC 9700 and
  removed in OAuth 2.1.
- `auth.py.oauth.insecure-token-endpoint` (AUTH-PY-OAUTH-002, CWE-319): flags
  OAuth/OIDC authorize, token, and `.well-known` endpoints contacted over
  cleartext `http://`; `localhost` and loopback dev hosts are not flagged.
- `auth.py.oauth.static-state` (AUTH-PY-OAUTH-003, CWE-330): flags a hardcoded
  constant `state` in an authorization request, which provides no CSRF
  protection.
- `auth.py.jwt.untrusted-verify-key` (AUTH-PY-JWT-007, CWE-347): taint rule for
  request-controlled key / `algorithms` reaching `jwt.decode` (PyJWT,
  python-jose); the sink is focused on the key and algorithms, never the token.
- `auth.py.oauth.insecure-transport-env` (AUTH-PY-OAUTH-004, CWE-319, native):
  flags setting `OAUTHLIB_INSECURE_TRANSPORT`, which disables oauthlib's HTTPS
  requirement for OAuth flows.
- `auth.py.oauth.token-request-verify-disabled` (AUTH-PY-OAUTH-005, CWE-295,
  native): flags `verify=False` on Authlib / requests-oauthlib token-exchange
  calls (`fetch_token` / `refresh_token` / `fetch_access_token`).

All six are low-false-positive and ship vulnerable/safe fixtures.
