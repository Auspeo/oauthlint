---
layout: ../../layouts/DocsLayout.astro
title: "GitHub Action"
description: "Run OAuthLint in CI with a Docker-based GitHub Action that gates PRs by severity and uploads findings to GitHub code scanning as SARIF."
section: "github-action"
---

# GitHub Action

Drop OAuthLint into any repository's CI to catch OAuth / OIDC / JWT anti-patterns on every push and pull request, with no language setup required.

## Quick usage

Add one step after checking out your code:

```yaml
- uses: actions/checkout@v4
- uses: Auspeo/oauthlint@v1
  with:
    severity: HIGH   # only emit HIGH+ findings
    fail-on: HIGH    # fail the job on HIGH+
```

The action is **Docker-based**. It runs the OAuthLint CLI inside a prebuilt image, so it works in any repo regardless of the project's language and needs no Node or toolchain setup of your own.

`Auspeo/oauthlint@v1` is the [GitHub Marketplace](https://github.com/marketplace) entrypoint. The original subpath form `Auspeo/oauthlint/action@v1` still works and behaves identically; the root action is a thin composite that delegates to it.

## Complete workflow

Save this as `.github/workflows/oauthlint.yml`. It scans on every push and pull request, gates the job by severity, and uploads findings to GitHub code scanning as SARIF so they appear in the **Security → Code scanning** tab and as inline annotations on the PR.

```yaml
name: OAuthLint
on: [push, pull_request]

permissions:
  contents: read
  security-events: write   # required to upload SARIF

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: oauthlint
        uses: Auspeo/oauthlint@v1
        with:
          sarif: 'true'
          # SARIF is for surfacing findings, not for gating. Use fail-on to
          # gate the job independently of the upload.
          fail-on: 'HIGH'

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: ${{ steps.oauthlint.outputs.sarif-file }}
```

## PR annotations

The action posts **inline annotations on the changed lines** of a pull request out of the box. Each finding shows up in the **Files changed** tab and the checks summary, with a per-severity job summary. This is on by default; set the `annotations` input to `'false'` to turn it off. No extra permissions or steps are needed.

For the richer **Security → Code scanning** experience as well, set `sarif: 'true'` and feed the action's `sarif-file` output to [`github/codeql-action/upload-sarif`](https://github.com/github/codeql-action) (as shown above). This lists findings under code scanning and requires `security-events: write` permission.

The SARIF pass always runs with `--fail-on off` internally and its exit code is swallowed, so generating the report never fails the job on its own. Gating is controlled solely by the `fail-on` input.

## Inputs

All inputs are optional.

| Name | Default | Description |
|------|---------|-------------|
| `path` | `.` | Path to scan. Defaults to the repo root. |
| `severity` | *(none)* | Filter floor. Only emit findings at this severity or above: `INFO` / `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`. Empty means emit all. |
| `fail-on` | `HIGH` | Fail the job if any finding is at this severity or above. Use `off` to never fail. |
| `json` | `false` | When `true`, also write a JSON report. |
| `output` | `oauthlint-report.json` | Path to write the JSON report (only used when `json=true`). |
| `sarif` | `false` | When `true`, also emit a SARIF 2.1.0 report for GitHub code scanning. |
| `sarif-file` | `oauthlint.sarif` | Path to write the SARIF report (only used when `sarif=true`). |

## Outputs

| Name | Description |
|------|-------------|
| `findings` | Number of findings, after severity filtering. (Populated only when `json=true`; otherwise `0`.) |
| `highest-severity` | Highest severity in the report, or `NONE`. (Populated only when `json=true`.) |
| `sarif-file` | Path to the generated SARIF report. Only set when `sarif=true`. |

## Examples

### Surface MEDIUM+ in logs, but only block on CRITICAL

```yaml
- uses: Auspeo/oauthlint@v1
  with:
    severity: MEDIUM
    fail-on: CRITICAL
```

### Upload a JSON report as an artifact

```yaml
- id: oauthlint
  uses: Auspeo/oauthlint@v1
  with:
    json: 'true'
    output: 'oauthlint.json'
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: oauthlint-report
    path: oauthlint.json
```

The `findings` and `highest-severity` outputs are available in later steps via `${{ steps.oauthlint.outputs.findings }}` once `json=true`.

## See also

- [GitHub code scanning](/docs/code-scanning): a full walkthrough of the SARIF upload above and what the Security tab experience looks like.
- [GitLab CI](/docs/gitlab-ci): the same scan and SARIF report in a GitLab pipeline.
- [CLI reference](/docs/cli): every flag the action runs under the hood.
- [Configuration](/docs/configuration): pin a severity floor, scope paths, and toggle rules with an `.oauthlintrc.yml` that the action picks up automatically.
