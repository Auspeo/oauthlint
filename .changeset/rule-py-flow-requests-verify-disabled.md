---
'oauthlint-rules': minor
---

Add `auth.py.flow.requests-verify-disabled` (AUTH-PY-FLOW-002, CWE-295). Flags
Python `requests` calls that disable TLS certificate verification with
`verify=False` — `requests.get/post/put/delete/patch/head/options/request(...)`
as well as `Session` calls (`$SESSION.get(..., verify=False)`, etc.). Disabling
verification opens OAuth/OIDC token and secret exchanges to man-in-the-middle
attacks. To keep false positives low the rule fires only on the literal
`verify=False`; `verify=True`, a custom CA bundle path
(`verify="/etc/ssl/ca.pem"`) and the absence of `verify` are not flagged.
