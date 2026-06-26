---
"oauthlint": minor
---

feat(cli): notify when a newer version is available

On normal runs the CLI checks (at most once a day, cached, non-blocking) whether a
newer `oauthlint` is on npm and prints an upgrade hint to stderr. Silent in CI,
when piped, with `--json`/`--format sarif`, with `NO_UPDATE_NOTIFIER`, or `--no-update-check`.
