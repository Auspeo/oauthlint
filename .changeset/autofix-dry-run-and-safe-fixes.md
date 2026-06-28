---
"oauthlint-rules": minor
"oauthlint": minor
---

Expand and harden the `--fix` autofix capability.

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
