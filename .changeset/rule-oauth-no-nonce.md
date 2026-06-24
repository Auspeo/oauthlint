---
'oauthlint-rules': minor
---

feat(rules): add `auth.oauth.no-nonce` (AUTH-OAUTH-010). Flags an OIDC
authorization request (scope contains `openid`) built without a `nonce`
parameter. The nonce binds the id_token to the request (OIDC Core §3.1.2.1) —
its absence enables id_token replay/substitution (CWE-294). Detects both inline
authorize-URL strings and programmatic `URLSearchParams` builds. Does not fire
on pure OAuth flows (no `openid` scope) or when a nonce is already present.
