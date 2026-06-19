# oauthlint-rules

A focused Semgrep rule library targeting the OAuth/OIDC/JWT anti-patterns that
AI coding tools (Cursor, Claude Code, Copilot, Gemini Code Assist) produce on a
recurring basis.

This package contains:

- the YAML rules (Semgrep format) in `rules/`
- the loader + Zod validation schema in `src/`
- the test fixtures (vulnerable + safe) in `tests/fixtures/`

## Usage

```ts
import { loadAllRules, buildManifest } from 'oauthlint-rules';

const rules = await loadAllRules();      // validates everything on load
const manifest = await buildManifest();  // summary for the CLI
```

To scan code, use the [`oauthlint`](../cli) binary, which invokes Semgrep under
the hood, passing this package as the `--config` argument.

## Rule catalogue (30 rules)

`LLM` = how often AI coding tools introduce the anti-pattern (prevalence).

### JWT — RFC 7519 / 7515 / 7518

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.jwt.alg-none` | ERROR | HIGH | CWE-327 | `alg: none` accepted in the verifier's allow-list |
| `auth.jwt.weak-secret` | ERROR | HIGH | CWE-798 | Hard-coded or trivial JWT signing secret |
| `auth.jwt.algorithm-confusion` | ERROR | MEDIUM | CWE-327 | HS256 verification against an asymmetric (RS/ES) key |
| `auth.jwt.in-url` | ERROR | MEDIUM | CWE-598 | JWT (`eyJ…`) passed in a URL query string |
| `auth.jwt.no-expiration` | WARNING | HIGH | CWE-613 | JWT signed/verified without an `exp` / `expiresIn` claim |
| `auth.jwt.no-audience` | WARNING | MEDIUM | CWE-345 | JWT verified without checking the `aud` (audience) claim |
| `auth.jwt.localstorage` | WARNING | HIGH | CWE-922 | Auth token written to `localStorage` |
| `auth.jwt.no-issuer` | INFO | LOW | CWE-345 | JWT verified without checking the `iss` (issuer) claim |

### OAuth 2.0 — RFC 6749 / 7636 / 8252 / 9700

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.oauth.no-state` | ERROR | HIGH | CWE-352 | Authorization request built without a `state` parameter |
| `auth.oauth.wildcard-redirect` | ERROR | MEDIUM | CWE-601 | `redirect_uri` allow-list with a wildcard / `http://` URL |
| `auth.oauth.hardcoded-secret` | ERROR | HIGH | CWE-798 | `client_secret` hard-coded in source |
| `auth.oauth.implicit-flow` | ERROR | MEDIUM | CWE-1004 | OAuth implicit flow (deprecated) |
| `auth.oauth.open-redirect-callback` | ERROR | HIGH | CWE-601 | Callback redirects to a user-controlled URL |
| `auth.oauth.no-pkce` | WARNING | HIGH | CWE-345 | Public client without PKCE |
| `auth.oauth.no-state-validation` | WARNING | HIGH | CWE-352 | `state` received but never validated |
| `auth.oauth.long-token-lifetime` | WARNING | MEDIUM | CWE-613 | Over-long `expires_in` / token lifetime |
| `auth.oauth.broad-scope` | INFO | HIGH | CWE-272 | Over-broad scope requested (`admin`, `*`) |

### Cookies — RFC 6265

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.cookie.no-secure` | WARNING | HIGH | CWE-614 | Auth cookie set without the `Secure` flag |
| `auth.cookie.no-httponly` | WARNING | HIGH | CWE-1004 | Auth cookie set without the `HttpOnly` flag |
| `auth.cookie.no-samesite` | INFO | MEDIUM | CWE-1275 | Auth cookie set without `SameSite` |
| `auth.cookie.long-lived` | INFO | MEDIUM | CWE-613 | Auth cookie with an excessively long `maxAge` |

### Sessions

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.session.id-in-url` | ERROR | MEDIUM | CWE-598 | Session id / token in a URL query string |
| `auth.session.no-regeneration` | WARNING | MEDIUM | CWE-384 | Session not regenerated on login (fixation) |

### CORS

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.cors.wildcard-with-credentials` | ERROR | HIGH | CWE-942 | `Allow-Origin: *` combined with credentials |

### Secrets

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.secret.provider-key` | ERROR | HIGH | CWE-798 | Hard-coded key matching a known provider's format |

### Auth flow

| ID | Severity | LLM | CWE | Description |
|----|----------|-----|-----|-------------|
| `auth.flow.password-plaintext` | ERROR | MEDIUM | CWE-256 | Password persisted without hashing |
| `auth.flow.insecure-random` | ERROR | HIGH | CWE-338 | `Math.random()` used for a security-sensitive value |
| `auth.flow.timing-unsafe-compare` | WARNING | MEDIUM | CWE-208 | Secret compared with `===` (non-constant-time) |
| `auth.flow.password-min-length` | WARNING | MEDIUM | CWE-521 | Password policy enforces too short a minimum length |
| `auth.flow.no-rate-limit` | INFO | HIGH | CWE-307 | Auth endpoint (`/login`, etc.) without rate limiting |

## License

MIT — see [LICENSE](../LICENSE).
