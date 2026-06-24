# OAuthLint rule catalogue

66 rules grouped by category.

<!-- Generated from rules/rules/ + the matching fixtures — keep the YAML/fixtures authoritative. -->

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
| [`auth.cors.null-origin`](./cors-null-origin.md) | ERROR | MEDIUM | CWE-942 | A05:2021 |
| [`auth.cors.reflect-origin`](./cors-reflect-origin.md) | ERROR | MEDIUM | CWE-942 | A05:2021 |
| [`auth.cors.wildcard-with-credentials`](./cors-wildcard-with-credentials.md) | ERROR | HIGH | CWE-942 | API8:2023 |

## FLOW

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.flow.credentials-in-url`](./flow-credentials-in-url.md) | ERROR | HIGH | CWE-598 | API2:2023 |
| [`auth.flow.insecure-random`](./flow-insecure-random.md) | ERROR | HIGH | CWE-338 | API2:2023 |
| [`auth.flow.no-rate-limit`](./flow-no-rate-limit.md) | INFO | HIGH | CWE-307 | API4:2023 |
| [`auth.flow.password-min-length`](./flow-password-min-length.md) | WARNING | MEDIUM | CWE-521 | API2:2023 |
| [`auth.flow.password-plaintext`](./flow-password-plaintext.md) | ERROR | MEDIUM | CWE-256 | API2:2023 |
| [`auth.flow.secret-in-log`](./flow-secret-in-log.md) | WARNING | HIGH | CWE-532 | API8:2023 |
| [`auth.flow.timing-unsafe-compare`](./flow-timing-unsafe-compare.md) | WARNING | MEDIUM | CWE-208 | API2:2023 |
| [`auth.flow.weak-bcrypt-rounds`](./flow-weak-bcrypt-rounds.md) | WARNING | MEDIUM | CWE-916 | A02:2021 |
| [`auth.flow.weak-password-hash`](./flow-weak-password-hash.md) | ERROR | HIGH | CWE-916 | A02:2021 |

## GO-COOKIE

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.go.cookie.insecure`](./go-cookie-insecure.md) | ERROR | HIGH | CWE-614 | A05:2021 |

## GO-FLOW

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.go.flow.weak-rand`](./go-flow-weak-rand.md) | ERROR | HIGH | CWE-330 | A02:2021 |

## GO-JWT

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.go.jwt.hardcoded-secret`](./go-jwt-hardcoded-secret.md) | ERROR | HIGH | CWE-798 | API2:2023 |
| [`auth.go.jwt.none-algorithm`](./go-jwt-none-algorithm.md) | ERROR | HIGH | CWE-347 | API2:2023 |
| [`auth.go.jwt.parse-unverified`](./go-jwt-parse-unverified.md) | ERROR | HIGH | CWE-347 | API2:2023 |

## GO-TLS

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.go.tls.insecure-skip-verify`](./go-tls-insecure-skip-verify.md) | ERROR | HIGH | CWE-295 | A02:2021 |

## JAVA-COOKIE

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.java.cookie.insecure`](./java-cookie-insecure.md) | ERROR | HIGH | CWE-614 | A05:2021 |

## JAVA-CRYPTO

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.java.crypto.insecure-random`](./java-crypto-insecure-random.md) | ERROR | HIGH | CWE-330 | A02:2021 |
| [`auth.java.crypto.weak-password-hash`](./java-crypto-weak-password-hash.md) | ERROR | HIGH | CWE-916 | A02:2021 |

## JAVA-JWT

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.java.jwt.unsigned-jwt`](./java-jwt-unsigned-jwt.md) | ERROR | MEDIUM | CWE-347 | API2:2023 |

## JAVA-WEB

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.java.web.csrf-disabled`](./java-web-csrf-disabled.md) | ERROR | HIGH | CWE-352 | A01:2021 |
| [`auth.java.web.permit-all`](./java-web-permit-all.md) | ERROR | HIGH | CWE-862 | A01:2021 |

## JWT

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.jwt.alg-none`](./jwt-alg-none.md) | ERROR | HIGH | CWE-327 | API2:2023 |
| [`auth.jwt.algorithm-confusion`](./jwt-algorithm-confusion.md) | ERROR | MEDIUM | CWE-327 | API2:2023 |
| [`auth.jwt.decode-without-verify`](./jwt-decode-without-verify.md) | WARNING | HIGH | CWE-347 | API2:2023 |
| [`auth.jwt.in-url`](./jwt-in-url.md) | ERROR | MEDIUM | CWE-598 | API1:2023 |
| [`auth.jwt.localstorage`](./jwt-localstorage.md) | WARNING | HIGH | CWE-922 | API8:2023 |
| [`auth.jwt.no-algorithms-allowlist`](./jwt-no-algorithms-allowlist.md) | WARNING | HIGH | CWE-347 | API2:2023 |
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
| [`auth.oauth.no-nonce`](./oauth-no-nonce.md) | WARNING | MEDIUM | CWE-294 | API2:2023 |
| [`auth.oauth.no-pkce`](./oauth-no-pkce.md) | WARNING | HIGH | CWE-345 | API1:2023 |
| [`auth.oauth.no-state`](./oauth-no-state.md) | ERROR | HIGH | CWE-352 | API1:2023 |
| [`auth.oauth.no-state-validation`](./oauth-no-state-validation.md) | WARNING | HIGH | CWE-352 | API1:2023 |
| [`auth.oauth.open-redirect-callback`](./oauth-open-redirect-callback.md) | ERROR | HIGH | CWE-601 | API1:2023 |
| [`auth.oauth.pkce-plain`](./oauth-pkce-plain.md) | WARNING | MEDIUM | CWE-757 | API2:2023 |
| [`auth.oauth.wildcard-redirect`](./oauth-wildcard-redirect.md) | ERROR | MEDIUM | CWE-601 | API1:2023 |

## PY-COOKIE

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.py.cookie.insecure-flags`](./py-cookie-insecure-flags.md) | ERROR | HIGH | CWE-614 | A05:2021 |

## PY-FLOW

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.py.flow.csrf-exempt`](./py-flow-csrf-exempt.md) | WARNING | HIGH | CWE-352 | A01:2021 |
| [`auth.py.flow.debug-enabled`](./py-flow-debug-enabled.md) | WARNING | HIGH | CWE-489 | A05:2021 |
| [`auth.py.flow.insecure-random-token`](./py-flow-insecure-random-token.md) | ERROR | HIGH | CWE-330 | A02:2021 |
| [`auth.py.flow.requests-verify-disabled`](./py-flow-requests-verify-disabled.md) | ERROR | HIGH | CWE-295 | API8:2023 |
| [`auth.py.flow.weak-password-hash`](./py-flow-weak-password-hash.md) | ERROR | HIGH | CWE-916 | A02:2021 |

## PY-JWT

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.py.jwt.alg-none`](./py-jwt-alg-none.md) | ERROR | HIGH | CWE-347 | API2:2023 |
| [`auth.py.jwt.hardcoded-secret`](./py-jwt-hardcoded-secret.md) | ERROR | HIGH | CWE-798 | API2:2023 |
| [`auth.py.jwt.no-algorithms`](./py-jwt-no-algorithms.md) | WARNING | HIGH | CWE-347 | API2:2023 |
| [`auth.py.jwt.no-verify`](./py-jwt-no-verify.md) | ERROR | HIGH | CWE-347 | API2:2023 |

## PY-SECRET

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.py.secret.django-hardcoded-key`](./py-secret-django-hardcoded-key.md) | ERROR | HIGH | CWE-798 | A07:2021 |
| [`auth.py.secret.flask-hardcoded-key`](./py-secret-flask-hardcoded-key.md) | ERROR | HIGH | CWE-798 | A07:2021 |

## SECRET

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.secret.provider-key`](./secret-provider-key.md) | ERROR | HIGH | CWE-798 | API8:2023 |
| [`auth.secret.public-env-secret`](./secret-public-env-secret.md) | ERROR | HIGH | CWE-200 | A02:2021 |

## SESSION

| Rule | Severity | LLM | CWE | OWASP |
|------|----------|-----|-----|-------|
| [`auth.session.hardcoded-secret`](./session-hardcoded-secret.md) | ERROR | HIGH | CWE-798 | A07:2021 |
| [`auth.session.id-in-url`](./session-id-in-url.md) | ERROR | MEDIUM | CWE-598 | API1:2023 |
| [`auth.session.no-regeneration`](./session-no-regeneration.md) | WARNING | MEDIUM | CWE-384 | API2:2023 |
