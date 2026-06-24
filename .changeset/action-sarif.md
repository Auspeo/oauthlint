---
'oauthlint-action': minor
---

Add native SARIF output for GitHub Code Scanning. Enable `sarif: true` to emit a
SARIF 2.1.0 report (path configurable via `sarif-file`, default `oauthlint.sarif`)
and consume the new `sarif-file` output with `github/codeql-action/upload-sarif`.
The SARIF pass is additive and never gates the job; `fail-on` still controls job
failure independently.
