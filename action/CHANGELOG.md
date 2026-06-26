# oauthlint-action

## Unreleased

### Minor Changes

- Emit inline PR annotations and a Markdown job summary for every finding. Each
  finding becomes a GitHub workflow-command annotation (`::error` for HIGH/CRITICAL,
  `::warning` for MEDIUM and below) so it renders inline on the PR's _Files changed_
  tab, and a count-by-severity table is written to `$GITHUB_STEP_SUMMARY`. Paths are
  normalized to be repo-relative and rules link to their `oauthlint.dev` docs. This
  is additive and on by default; opt out with the new `annotations: 'false'` input.
  No token or extra permission is required. SARIF, `fail-on` gating, and the existing
  outputs are unchanged.

## 0.2.0

### Minor Changes

- ce388d7: Add native SARIF output for GitHub Code Scanning. Enable `sarif: true` to emit a
  SARIF 2.1.0 report (path configurable via `sarif-file`, default `oauthlint.sarif`)
  and consume the new `sarif-file` output with `github/codeql-action/upload-sarif`.
  The SARIF pass is additive and never gates the job; `fail-on` still controls job
  failure independently.
