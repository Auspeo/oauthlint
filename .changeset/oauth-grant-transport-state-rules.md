---
"oauthlint-rules": minor
---

feat(rules): three new OAuth rules — ROPC grant, cleartext endpoint, static state

- `auth.oauth.ropc-grant` (AUTH-OAUTH-014, CWE-522): flags the Resource Owner
  Password Credentials grant (`grant_type=password`), forbidden by RFC 9700 and
  removed in OAuth 2.1.
- `auth.oauth.insecure-token-endpoint` (AUTH-OAUTH-015, CWE-319): flags OAuth/OIDC
  authorize and token endpoints contacted over cleartext `http://`; `localhost`
  loopback dev hosts are not flagged.
- `auth.oauth.static-state` (AUTH-OAUTH-016, CWE-330): flags a hardcoded constant
  `state` in an authorization request, which provides no CSRF protection.

All three are JS/TS, low-false-positive, and ship vulnerable/safe fixtures.
