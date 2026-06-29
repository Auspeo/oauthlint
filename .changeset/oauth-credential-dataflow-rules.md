---
"oauthlint-rules": minor
---

Add three dataflow (taint) rules that track untrusted request input into
OAuth/OIDC-sensitive sinks:

- `auth.flow.oauth-credential-in-log` (JS/TS, CWE-532): an OAuth credential
  from the request — an authorization `code`, `access_token` / `refresh_token`
  / `id_token`, bearer `token`, `client_secret`, or the raw `Authorization`
  header — flowing into a `console.*` / `logger.*` call. Keyed on the request
  source (not the logged variable name, as `auth.flow.secret-in-log` is), so it
  catches the leak through arbitrarily-named intermediates while a redacting or
  truncating helper clears the taint.
- `auth.jwt.untrusted-verify-key` (JS/TS, CWE-347): request input flowing into
  the verification key or the `algorithms` allowlist of `jwt.verify(...)`. The
  sink focuses the key/algorithms argument (never the token), so it fires only
  on attacker-controlled verification — distinct from the
  algorithm-confusion and missing-allowlist rules.
- `auth.py.flow.oauth-credential-in-log` (Python/Flask, CWE-532): the Flask
  variant of the credential-in-log rule, tracking credential-named
  `request.*`/header values into `print` / `logging.*` / `logger.*`.

Each ships annotated `vulnerable` and `safe` fixtures, including a sanitizer
true-negative.
