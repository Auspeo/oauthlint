---
"oauthlint": minor
---

feat(cli): incremental scanning — `--diff`, `--staged`, and multiple path args

`oauthlint scan` now accepts multiple file/path arguments, and two new flags scan
only what changed: `--diff [<ref>]` (files changed vs a git ref — default: the
merge-base with the default branch) and `--staged` (git-staged files). Makes CI
and pre-commit runs fast on large repos. Git calls are argv-safe (no shell);
empty change sets exit 0; outside a git repo gives a clear error.
