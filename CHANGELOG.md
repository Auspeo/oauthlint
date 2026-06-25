# Changelog

All notable changes to oauthlint are recorded here. Per-package detail lives in
[`cli/CHANGELOG.md`](cli/CHANGELOG.md) and [`rules/CHANGELOG.md`](rules/CHANGELOG.md).
The project follows [Semantic Versioning](https://semver.org); it is pre-1.0, so
minor versions may still change behavior.

## [0.2.1] — 2026-06-25

### Fixed

- Rules: eliminated two false positives surfaced by hand-verifying the
  AI-codegen benchmark.
  - `auth.oauth.no-state-validation` no longer fires when `state` is read into a
    local variable and validated afterwards (only inline-`if` validation was
    recognized before).
  - `auth.cors.reflect-origin` no longer fires on an allowlist callback that
    gates `cb(null, true)` behind an origin check — the safe shape the rule
    itself recommends. It now flags only callbacks that ignore their origin
    argument and allow unconditionally.
- Rules: `auth.jwt.localstorage` now catches token-named *values*, not only
  token-named string-literal keys — `localStorage.setItem(TOKEN_KEY, token)`,
  where the key is a variable, was previously missed.

## [0.2.0] — 2026-06-25

### Added

- **Multi-language support.** The rule pack is now language-aware
  (`auth.<lang>.<category>.<name>`) with zero change to existing JS/TS rule ids
  or doc URLs. **90 rules** across five languages:
  - JavaScript / TypeScript — 42 rules
  - Python (PyJWT, requests, Flask, Django) — 12 rules
  - Go (golang-jwt, crypto/tls, net/http) — 12 rules
  - Java (Spring Security, jjwt, JCA) — 12 rules
  - Rust (jsonwebtoken, reqwest, RustCrypto) — 12 rules
- Every new rule ships vulnerable + safe fixtures, a CWE/OWASP mapping, and a
  generated documentation page; each was false-positive-validated against
  real-world repositories.
- GitHub Action: native SARIF output (`sarif: true` + `sarif-file` output) for
  GitHub Code Scanning.

### Fixed

- CLI: large `--json` / `--format sarif` reports are no longer truncated when
  piped (stdout is flushed before exit). A scan whose Semgrep output cannot be
  parsed now fails loudly (exit 2) instead of silently reporting zero findings.
  SARIF paths are relativised robustly.
- CLI: language-pack rule ids are normalised in scan output, so the
  Python/Go/Java/Rust rules display correctly and inline suppressions match
  them.
- Rules: false-positive fixes across several rules (e.g.
  `auth.flow.timing-unsafe-compare` on literal comparisons).

## [0.1.1] — 2026-06-19

### Fixed

- `oauthlint-rules` now declares `fast-glob` as a runtime dependency. Standalone
  installs of `0.1.0` crashed with `ERR_MODULE_NOT_FOUND` because the dependency
  only resolved through monorepo hoisting. `0.1.0` is deprecated on npm; use
  `0.1.1` or later.

## [0.1.0] — 2026-06-19

### Added

- First release. 30 Semgrep rules covering OAuth 2.0, OIDC, JWT, cookies, CORS
  and session hygiene, each mapped to CWE and OWASP with a documentation page.
- `oauthlint` CLI: `scan`, `list`, `init`, `doctor`, with pretty, JSON and SARIF
  output and an opt-in `--fix`.
- Docker-based GitHub Action.
- VS Code extension with inline diagnostics and Quick Fix suppressions.

[0.2.1]: https://github.com/Auspeo/oauthlint/releases/tag/v0.2.1
[0.2.0]: https://github.com/Auspeo/oauthlint/releases/tag/v0.2.0
[0.1.1]: https://github.com/Auspeo/oauthlint/releases/tag/v0.1.1
[0.1.0]: https://github.com/Auspeo/oauthlint/releases/tag/v0.1.1
