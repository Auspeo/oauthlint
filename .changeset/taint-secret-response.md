---
"oauthlint-rules": patch
---

feat(rules): dataflow (taint-mode) secret-in-response detection — JS/TS, Python, Go

Trace a server secret (an env value whose name looks like a credential) into an HTTP response body
(CWE-200 / OWASP API3:2023) — i.e. the server leaking its own secrets to the client. `auth.flow.secret-in-response`
(Express), `auth.py.flow.secret-in-response` (Flask), `auth.go.flow.secret-in-response` (net/http). Deliberately
client-public vars (`NEXT_PUBLIC_`/`PUBLIC_`/`VITE_`/…) are excluded to stay low-FP.
