---
"oauthlint-rules": patch
---

Autofix for the two TLS-verification rules. `auth.py.flow.requests-verify-disabled`
and `auth.py.oauth.token-request-verify-disabled` now ship a safe `fix:` that
flips `verify=False` to `verify=True` (only the value token is rewritten; the
rest of the call is untouched), so `oauthlint scan --fix` remediates them and the
fix rides along in the `--json` / SARIF output.
