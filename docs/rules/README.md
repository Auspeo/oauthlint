# OAuthLint rule catalogue

30 rules grouped by category. Each page is generated from `packages/oauthlint-rules/rules/` and the matching fixtures — keep the YAML/fixtures authoritative.

## COOKIE

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.cookie.long-lived`](./cookie-long-lived.md) | INFO | MEDIUM | CWE-613 | API2:2023 |
| [`auth.cookie.no-httponly`](./cookie-no-httponly.md) | WARNING | HIGH | CWE-1004 | API8:2023 |
| [`auth.cookie.no-samesite`](./cookie-no-samesite.md) | INFO | MEDIUM | CWE-1275 | API1:2023 |
| [`auth.cookie.no-secure`](./cookie-no-secure.md) | WARNING | HIGH | CWE-614 | API8:2023 |

## CORS

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.cors.wildcard-with-credentials`](./cors-wildcard-with-credentials.md) | ERROR | HIGH | CWE-942 | API8:2023 |

## FLOW

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.flow.insecure-random`](./flow-insecure-random.md) | ERROR | HIGH | CWE-338 | API2:2023 |
| [`auth.flow.no-rate-limit`](./flow-no-rate-limit.md) | INFO | HIGH | CWE-307 | API4:2023 |
| [`auth.flow.password-min-length`](./flow-password-min-length.md) | WARNING | MEDIUM | CWE-521 | API2:2023 |
| [`auth.flow.password-plaintext`](./flow-password-plaintext.md) | ERROR | MEDIUM | CWE-256 | API2:2023 |
| [`auth.flow.timing-unsafe-compare`](./flow-timing-unsafe-compare.md) | WARNING | MEDIUM | CWE-208 | API2:2023 |

## JWT

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.jwt.alg-none`](./jwt-alg-none.md) | ERROR | HIGH | CWE-327 | API2:2023 |
| [`auth.jwt.algorithm-confusion`](./jwt-algorithm-confusion.md) | ERROR | MEDIUM | CWE-327 | API2:2023 |
| [`auth.jwt.in-url`](./jwt-in-url.md) | ERROR | MEDIUM | CWE-598 | API1:2023 |
| [`auth.jwt.localstorage`](./jwt-localstorage.md) | WARNING | HIGH | CWE-922 | API8:2023 |
| [`auth.jwt.no-audience`](./jwt-no-audience.md) | WARNING | MEDIUM | CWE-345 | API2:2023 |
| [`auth.jwt.no-expiration`](./jwt-no-expiration.md) | WARNING | HIGH | CWE-613 | API2:2023 |
| [`auth.jwt.no-issuer`](./jwt-no-issuer.md) | INFO | LOW | CWE-345 | API2:2023 |
| [`auth.jwt.weak-secret`](./jwt-weak-secret.md) | ERROR | HIGH | CWE-798 | API2:2023 |

## OAUTH

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.oauth.broad-scope`](./oauth-broad-scope.md) | INFO | HIGH | CWE-272 | API1:2023 |
| [`auth.oauth.hardcoded-secret`](./oauth-hardcoded-secret.md) | ERROR | HIGH | CWE-798 | API8:2023 |
| [`auth.oauth.implicit-flow`](./oauth-implicit-flow.md) | ERROR | MEDIUM | CWE-1004 | API1:2023 |
| [`auth.oauth.long-token-lifetime`](./oauth-long-token-lifetime.md) | WARNING | MEDIUM | CWE-613 | API2:2023 |
| [`auth.oauth.no-pkce`](./oauth-no-pkce.md) | WARNING | HIGH | CWE-345 | API1:2023 |
| [`auth.oauth.no-state`](./oauth-no-state.md) | ERROR | HIGH | CWE-352 | API1:2023 |
| [`auth.oauth.no-state-validation`](./oauth-no-state-validation.md) | WARNING | HIGH | CWE-352 | API1:2023 |
| [`auth.oauth.open-redirect-callback`](./oauth-open-redirect-callback.md) | ERROR | HIGH | CWE-601 | API1:2023 |
| [`auth.oauth.wildcard-redirect`](./oauth-wildcard-redirect.md) | ERROR | MEDIUM | CWE-601 | API1:2023 |

## SECRET

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.secret.provider-key`](./secret-provider-key.md) | ERROR | HIGH | CWE-798 | API8:2023 |

## SESSION

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.session.id-in-url`](./session-id-in-url.md) | ERROR | MEDIUM | CWE-598 | API1:2023 |
| [`auth.session.no-regeneration`](./session-no-regeneration.md) | WARNING | MEDIUM | CWE-384 | API2:2023 |
