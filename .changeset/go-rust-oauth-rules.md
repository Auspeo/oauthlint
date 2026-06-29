---
"oauthlint-rules": minor
---

Add Go and Rust OAuth/OIDC/JWT rule coverage.

Go:

- `auth.go.oauth.ropc-grant` (AUTH-GO-OAUTH-001) — flags the Resource Owner
  Password Credentials grant via `oauth2.Config.PasswordCredentialsToken` or a
  hand-built `grant_type=password` token request. CWE-522.
- `auth.go.oauth.insecure-token-endpoint` (AUTH-GO-OAUTH-002) — flags an OAuth
  authorize/token endpoint contacted over cleartext `http://`, excluding
  localhost/loopback. CWE-319.
- `auth.go.oauth.static-state` (AUTH-GO-OAUTH-003) — flags a hardcoded `state`
  literal passed to `oauth2.Config.AuthCodeURL`. CWE-330.
- `auth.go.flow.oauth-credential-in-log` (AUTH-GO-FLOW-005) — taint rule for an
  OAuth credential from the request (code/token/`Authorization`) flowing into a
  `log`/`slog`/`fmt`/logger call. CWE-532.
- `auth.go.jwt.untrusted-verify-key` (AUTH-GO-JWT-006) — taint rule for
  request-controlled input reaching a `golang-jwt` keyfunc's returned key or
  `jwt.WithValidMethods`. CWE-347.

Rust:

- `auth.rust.oauth.ropc-grant` (AUTH-RUST-OAUTH-001) — flags the password grant
  via the `oauth2` crate's `exchange_password` or a hand-built
  `grant_type=password` request. CWE-522.
- `auth.rust.oauth.insecure-token-endpoint` (AUTH-RUST-OAUTH-002) — flags an
  OAuth endpoint over cleartext `http://`, excluding localhost/loopback.
  CWE-319.
- `auth.rust.oauth.static-state` (AUTH-RUST-OAUTH-003) — flags a hardcoded
  `CsrfToken::new("literal")` state. CWE-330.
