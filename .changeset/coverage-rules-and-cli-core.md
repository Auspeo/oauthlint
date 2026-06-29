---
"oauthlint-rules": minor
"oauthlint": minor
---

Rules: add SSRF coverage for Java (Spring `RestTemplate`/`WebClient`, OkHttp,
Apache HttpClient) and Rust (axum/actix into `reqwest`), and a JS/TS rule for
logging `Authorization: Basic` credentials (the `basic-auth` package result and
the `Proxy-Authorization` header). `cwe` is now required by the rule schema, and
the OWASP mappings were standardized (CORS and cookie-flag rules to API8:2023,
TLS to A02:2021, session fixation to API2:2023).

CLI: `SemgrepAdapter` gained optional `timeoutMs` and `maxOutputBytes` (both off
by default, so existing behaviour is unchanged) and a `SemgrepResourceError`, and
the package now exports them. This lets the new `oauthlint-mcp` server reuse the
scan engine with bounded resources.
