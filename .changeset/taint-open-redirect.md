---
"oauthlint-rules": patch
---

feat(rules): dataflow (taint-mode) open-redirect detection — JS/TS, Python, Go

The pack's first taint-mode rules: they trace untrusted request input to a redirect sink
(open redirect, CWE-601), a top OAuth threat. `auth.flow.open-redirect` (Express),
`auth.py.flow.open-redirect` (Flask), `auth.go.flow.open-redirect` (net/http). Allow-list /
`url_for` / validation sanitizers keep them low-FP.
