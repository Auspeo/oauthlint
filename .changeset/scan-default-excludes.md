---
"oauthlint": minor
---

Apply path excludes on scan so findings no longer fire on test, mock, and story
files by default.

The `exclude`/`include` config keys were parsed but never passed to the scan
engine, so they had no effect. They are now forwarded as `--exclude` /
`--include` flags (both drive `scan` and the autofix dry run). When a config
sets no `exclude`, a default non-production list is applied (test, spec, mock,
story, e2e, and build-output trees) so an out-of-the-box scan does not report
auth anti-patterns in fixtures and stubs, matching the intent of the `exclude`
block that `oauthlint init` already writes. Set `exclude: []` to scan
everything.
