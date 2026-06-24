---
'oauthlint': patch
---

fix(cli): three robustness fixes around scan output.

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
