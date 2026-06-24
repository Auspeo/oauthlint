# oauthlint

## 0.2.0

### Minor Changes

- The CLI now ships the expanded multi-language rule pack: 90 rules across
  JavaScript/TypeScript, Python, Go, Java, and Rust (up from 30 JS/TS rules).
  Installing `oauthlint` pulls in the full pack via `oauthlint-rules`.
- fix: normalise language-pack rule ids (`auth.<lang>.<cat>.<name>`) in scan
  output. Previously the 48 Python/Go/Java/Rust rules surfaced their raw
  Semgrep `check_id`, which broke their display in pretty/JSON/SARIF output and
  prevented inline `oauthlint-disable-next-line` suppressions from matching
  them.

### Patch Changes

- c3f5e41: fix(cli): three robustness fixes around scan output.

  - **Large output no longer truncates.** The CLI called `process.exit()`
    immediately after writing the report, which cut off any output exceeding
    the OS pipe buffer (~64 KB on macOS) — a `--json`/`--format sarif` report
    piped to a file came out as invalid JSON/SARIF. We now drain stdout/stderr
    before exiting. (This was the `Unterminated string … position 65519` error
    seen scanning large repos like Directus.)
  - **Unparseable Semgrep output now fails loudly.** A non-empty stdout that
    cannot be parsed used to be swallowed as "0 findings, exit 0", making a
    broken scan look clean in CI. It now throws and the `scan` command exits 2.
    Empty output is still treated as a clean scan.
  - **SARIF paths are relativised robustly.** `relativise()` no longer assumes
    `cwd === repo root`; it uses `path.relative`, keeps absolute paths that
    resolve outside the base, normalises Windows separators, and strips `./`.

- Updated dependencies [840268c]
- Updated dependencies [038b77b]
- Updated dependencies [05eea03]
- Updated dependencies [b3ccff7]
- Updated dependencies [1941d79]
- Updated dependencies [b3ccff7]
- Updated dependencies [6e8510d]
- Updated dependencies [b3ccff7]
- Updated dependencies [840268c]
- Updated dependencies [374d89d]
- Updated dependencies [374d89d]
- Updated dependencies [374d89d]
- Updated dependencies [374d89d]
- Updated dependencies [840268c]
- Updated dependencies [840268c]
- Updated dependencies [840268c]
- Updated dependencies [840268c]
- Updated dependencies [374d89d]
- Updated dependencies [374d89d]
- Updated dependencies [038b77b]
- Updated dependencies [f02218d]
- Updated dependencies [f02218d]
- Updated dependencies [038b77b]
- Updated dependencies [038b77b]
- Updated dependencies [f02218d]
- Updated dependencies [038b77b]
- Updated dependencies [f02218d]
- Updated dependencies [f02218d]
- Updated dependencies [f02218d]
- Updated dependencies [038b77b]
- Updated dependencies [1941d79]
- Updated dependencies [b3ccff7]
- Updated dependencies [1941d79]
- Updated dependencies [b3ccff7]
- Updated dependencies [6e8510d]
- Updated dependencies [6e8510d]
- Updated dependencies [6e8510d]
- Updated dependencies [05eea03]
- Updated dependencies [05eea03]
- Updated dependencies [05eea03]
- Updated dependencies [05eea03]
- Updated dependencies [6e8510d]
- Updated dependencies [6e8510d]
- Updated dependencies [05eea03]
- Updated dependencies [ade6ded]
- Updated dependencies [ade6ded]
- Updated dependencies [46302b1]
- Updated dependencies [46302b1]
- Updated dependencies [ade6ded]
- Updated dependencies [46302b1]
- Updated dependencies [ade6ded]
- Updated dependencies [ade6ded]
- Updated dependencies [46302b1]
- Updated dependencies [46302b1]
- Updated dependencies [46302b1]
- Updated dependencies [b3ccff7]
- Updated dependencies [1941d79]
- Updated dependencies [ade6ded]
- Updated dependencies [1941d79]
- Updated dependencies [447293f]
- Updated dependencies [1941d79]
  - oauthlint-rules@0.2.0

## 0.1.1

### Patch Changes

- Declare `fast-glob` as a runtime dependency of `oauthlint-rules`. It was a
  devDependency, so standalone installs from npm failed at runtime with
  `ERR_MODULE_NOT_FOUND: Cannot find package 'fast-glob'` (it only resolved in the
  monorepo via hoisting). The CLI bumps too so it depends on the fixed rules.
- Updated dependencies
  - oauthlint-rules@0.1.1
