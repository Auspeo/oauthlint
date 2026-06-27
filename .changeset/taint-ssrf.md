---
"oauthlint-rules": patch
---

feat(rules): dataflow (taint-mode) SSRF detection — JS/TS, Python, Go

Trace untrusted request input into an outbound HTTP request URL (Server-Side Request Forgery,
CWE-918 / OWASP API7:2023) — the path that lets an attacker reach internal services or the cloud
metadata endpoint to steal IAM credentials. `auth.flow.ssrf` (fetch/axios/http), `auth.py.flow.ssrf`
(requests/httpx/urllib), `auth.go.flow.ssrf` (net/http). Allow-list / host-validation sanitizers keep them low-FP.
