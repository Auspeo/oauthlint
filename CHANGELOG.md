# Changelog

All notable changes to oauthlint are recorded here. Per-package detail lives in
[`cli/CHANGELOG.md`](cli/CHANGELOG.md) and [`rules/CHANGELOG.md`](rules/CHANGELOG.md).
The project follows [Semantic Versioning](https://semver.org); it is pre-1.0, so
minor versions may still change behavior.

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

[0.1.1]: https://github.com/Auspeo/oauthlint/releases/tag/v0.1.1
[0.1.0]: https://github.com/Auspeo/oauthlint/releases/tag/v0.1.1
