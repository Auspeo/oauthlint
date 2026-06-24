---
'oauthlint-rules': minor
---

feat(rules): add `auth.flow.credentials-in-url` (AUTH-FLOW-009, CWE-598). Flags
a secret credential placed in a URL query string — `password`, `access_token`,
`client_secret`, `api_key`, `apikey`, or `secret` — built as a string/template
URL (`'/login?password=' + pw`, `` `?access_token=${t}` ``) or via
`URLSearchParams` `.set(...)` / `.append(...)`. Credentials in URLs leak through
server logs, browser history, and the `Referer` header (OWASP API2:2023,
llm-prevalence HIGH). Deliberately narrow to avoid false positives: it does NOT
flag the OAuth authorization `code`, `state`, or email `reset_token`/`verify_token`
links, nor the generic word `token` (only `access_token`), nor credentials sent
in a POST body or `Authorization` header.
