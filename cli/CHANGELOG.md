# oauthlint

## 0.7.1

### Patch Changes

- 2e9f5c0: Reduce false positives from the multi-language OAuth rules.

  A real-world validation run found that the new `ropc-grant` and `static-state`
  rules fired on the OAuth reference libraries' own source, examples, and tests:

  - `auth.py.oauth.ropc-grant` and `auth.oauth.ropc-grant` no longer match a bare
    `grant_type = "password"` assignment (a library's internal grant resolver).
    They require a request-body key or a call argument, which is what application
    misuse looks like.
  - `auth.rust.oauth.static-state` no longer fires inside `#[cfg(test)] mod tests`
    blocks, where a fixed `CsrfToken` is test scaffolding rather than a shipped
    constant.
  - The `ropc-grant` and `static-state` rules now skip test, example, vendored,
    and generated paths through rule-level `paths: exclude`.
  - next-auth false positives are cleared: `auth.flow.open-redirect` now requires
    an explicit receiver (it targets `res.redirect`, not the framework-level
    `redirect()` primitive), and `ssrf`, `timing-unsafe-compare`, and
    `samesite-none-insecure` skip example, docs, and vendored code.

  Detection on real application anti-patterns is unchanged: every rule fixture
  still fires. The rule schema now accepts an optional `paths` field.

- Updated dependencies [2e9f5c0]
  - oauthlint-rules@0.3.1

## 0.7.0

### Minor Changes

- da9c2b6: Expand and harden the `--fix` autofix capability.

  Rules:

  - Add safe, deterministic autofixes to the Go TLS/cookie rules:
    `auth.go.tls.insecure-skip-verify` (`InsecureSkipVerify: true` → `false`),
    `auth.go.tls.min-version` (obsolete `MinVersion` → `tls.VersionTLS12`), and
    `auth.go.cookie.insecure` (`Secure`/`HttpOnly: false` → `true`). Each is a
    literal replacement scoped to the offending field via `pattern-inside`, so
    surrounding code is untouched, and each is covered by the autofix safety
    contract (`fixes.test.ts`).
  - Remove the `fix:` from the JavaScript cookie rules (`auth.cookie.no-secure`,
    `auth.cookie.no-httponly`, `auth.cookie.no-samesite`). Their single
    rule-level spread template could corrupt source: on the 2-argument
    `res.cookie(name, value)` form it emitted a literal `$OPTS`, and it left an
    explicit `secure: false`/`httpOnly: false` in place. A correct fix isn't a
    clean literal replacement for these, so they now ship no autofix.

  CLI:

  - Add `--fix-dry-run`, which previews exactly what `--fix` would change as a
    unified diff per file without writing anything.
  - After a real `--fix`, print a summary of which files changed and how many
    fixes were applied. `--fix` is idempotent — running it twice is a no-op.

- 9d86336: Surface per-finding autofix data in the machine-readable report.

  When a matched rule ships a `fix:`, the finding now carries an optional `fix`
  object with the rendered replacement text and the exact span it overwrites
  (1-based line/column plus 0-based byte offsets). This is exposed in two places:

  - `--json` adds the optional `fix` field to each finding (omitted when there is
    no fix, so existing consumers are byte-compatible).
  - `--format sarif` populates the standard SARIF 2.1.0 `fixes` array on the
    result (`artifactChanges` → `replacements`), which SARIF-aware tools can
    apply directly.

  The pretty and HTML formatters are unchanged. This is what lets the VS Code
  extension offer a per-finding "Apply fix" Quick Fix without re-running `--fix`.

### Patch Changes

- Updated dependencies [da9c2b6]
- Updated dependencies [4a573c3]
- Updated dependencies [4a573c3]
- Updated dependencies [9d86336]
- Updated dependencies [9d86336]
- Updated dependencies [da9c2b6]
- Updated dependencies [4a573c3]
  - oauthlint-rules@0.3.0

## 0.6.1

### Patch Changes

- docs: fix broken links on the npm/README page

  The package README pointed at `/docs/baseline` (which 404s) and the old uppercase
  `/VALIDATION` URL. Point them at `/docs/cli#baseline` and `/validation`, and make
  the AI-tool naming inclusive ("tools like GitHub Copilot, Cursor, and Claude Code,
  and others") instead of a closed list.

## 0.6.0

### Minor Changes

- 267d3e9: feat(cli): `oauthlint explain <rule>` — the rule docs in your terminal

  Resolves a rule by id, slug, or AUTH-id and prints its severity, CWE/OWASP, LLM-prevalence,
  the why + fix, and the vulnerable/safe examples — offline, from the bundled pack. `--json` for
  the structured object. Pretty scan output now hints `oauthlint explain <rule-id>` per finding.

### Patch Changes

- Updated dependencies [267d3e9]
- Updated dependencies [8abda65]
  - oauthlint-rules@0.2.6

## 0.5.0

### Minor Changes

- a8d7db8: feat(cli): self-contained HTML report — `oauthlint scan --format html`

  A shareable, printable audit artifact (inline CSS, no JS, no external requests): summary by
  severity, findings grouped worst-first with rule id, file:line, message, code line, and a doc
  link. All interpolated values are HTML-escaped (injection-tested).

### Patch Changes

- Updated dependencies [a8d7db8]
- Updated dependencies [f6e6da2]
  - oauthlint-rules@0.2.5

## 0.4.0

### Minor Changes

- fe253ca: feat(cli): baseline support — adopt on existing codebases, alert only on new findings

  `oauthlint baseline` writes a `.oauthlint-baseline.json` of current findings (stable,
  line-shift-resilient fingerprints), and `oauthlint scan --baseline` reports only findings
  not in the baseline (exit code gates on new findings only).

- 54810db: feat(cli): notify when a newer version is available

  On normal runs the CLI checks (at most once a day, cached, non-blocking) whether a
  newer `oauthlint` is on npm and prints an upgrade hint to stderr. Silent in CI,
  when piped, with `--json`/`--format sarif`, with `NO_UPDATE_NOTIFIER`, or `--no-update-check`.

### Patch Changes

- Updated dependencies [fe253ca]
  - oauthlint-rules@0.2.4

## 0.3.0

### Minor Changes

- 0d0fb44: feat(cli): incremental scanning — `--diff`, `--staged`, and multiple path args

  `oauthlint scan` now accepts multiple file/path arguments, and two new flags scan
  only what changed: `--diff [<ref>]` (files changed vs a git ref — default: the
  merge-base with the default branch) and `--staged` (git-staged files). Makes CI
  and pre-commit runs fast on large repos. Git calls are argv-safe (no shell);
  empty change sets exit 0; outside a git repo gives a clear error.

### Patch Changes

- Updated dependencies [782d1c0]
- Updated dependencies [d2465c7]
  - oauthlint-rules@0.2.3

## 0.2.4

### Patch Changes

- docs: restore the demo GIF and CI badge in the npm README now that the
  repository is public (the `raw.githubusercontent.com` / Actions URLs resolve).
  The logo stays on the GitHub README only, since npm does not reliably render
  raw SVGs.

## 0.2.3

### Patch Changes

- chore: attribute the project to Auspeo instead of a personal name (LICENSE,
  package `author`, README bylines) and stop freezing the rule/language counts in
  prose ("90 rules", "five languages") so the copy doesn't go stale as coverage
  grows — counts now live only in the always-current rule catalogue.
- Updated dependencies
  - oauthlint-rules@0.2.2

## 0.2.2

### Patch Changes

- docs: rewrite the npm package README as a proper landing page (problem framing,
  honest "why not just Semgrep?", coverage table, accurate CI recipe, absolute
  URLs, corrected exit-code table). Docs-only republish so the improved page is
  live on npm.

## 0.2.1

### Patch Changes

- Updated dependencies [2e79ca4]
- Updated dependencies [768f0aa]
  - oauthlint-rules@0.2.1

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
