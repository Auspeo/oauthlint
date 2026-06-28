---
layout: ../../layouts/DocsLayout.astro
title: "GitHub code scanning"
description: "Send OAuthLint findings to the GitHub Security tab as SARIF. A complete copy-paste Actions workflow that scans on every push and pull request and uploads results to code scanning."
section: "code-scanning"
---

# GitHub code scanning

GitHub code scanning collects security findings under your repository's **Security → Code scanning** tab and annotates the exact lines on a pull request. OAuthLint speaks its native format, SARIF 2.1.0, so getting findings there is one extra step in the workflow you already run.

This page shows the full workflow, what each part does, and what the result looks like once it lands in the Security tab.

## The complete workflow

Save this as `.github/workflows/oauthlint.yml`. It scans on every push and pull request, gates the job on HIGH-and-above findings, and uploads a SARIF report to code scanning.

```yaml
name: OAuthLint
on: [push, pull_request]

permissions:
  contents: read
  security-events: write   # required to upload SARIF to code scanning

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: oauthlint
        uses: Auspeo/oauthlint@v1
        with:
          sarif: 'true'
          fail-on: 'HIGH'

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: ${{ steps.oauthlint.outputs.sarif-file }}
```

That's the whole thing. Three steps: check out the code, run OAuthLint with `sarif: 'true'`, and hand the report it produced to GitHub's official upload action.

## What each piece does

**`permissions: security-events: write`.** Code scanning uploads write to a protected API, so the job needs this scope. Without it the upload step fails with a permission error. `contents: read` is enough for the checkout. Set these at the workflow level (as above) or per job.

**`sarif: 'true'`.** This tells the Action to run an extra pass that writes a SARIF 2.1.0 file. The pass always runs with `--fail-on off` internally and its exit code is swallowed, so producing the report can never fail your job. The path it wrote is exposed as the `sarif-file` output (default `oauthlint.sarif`).

**`fail-on: 'HIGH'`.** Gating is separate from the report. The Action still runs a normal scan that fails the job when a finding meets this threshold. SARIF is for surfacing findings, not for deciding pass or fail. Keep both: the upload always happens, and the job still goes red on real problems. If you would rather never fail the job and only collect findings, set `fail-on: 'off'`.

**`upload-sarif@v3` with `if: always()`.** The official [`github/codeql-action/upload-sarif`](https://github.com/github/codeql-action) action reads the file named by `${{ steps.oauthlint.outputs.sarif-file }}` and posts it to code scanning. `if: always()` makes the upload run even when the scan step failed the job, so findings still reach the Security tab on a failing run.

## What you get in the Security tab

Once the workflow runs on your default branch, open **Security → Code scanning**. Each OAuthLint finding shows up as an alert with:

- The rule id and a one-line description, linking back to the rule's page on `oauthlint.dev`.
- The file and line it was found on, with the surrounding code.
- A severity. OAuthLint maps its levels to SARIF so GitHub colours them sensibly: `HIGH` and `CRITICAL` become `error`, `MEDIUM` becomes `warning`, and `INFO` and `LOW` become `note`. It also sets the numeric `security-severity` GitHub uses to sort alerts, so a `CRITICAL` ranks above a `MEDIUM`.

On a pull request, the same findings appear inline on the **Files changed** tab and in the checks summary, and GitHub will flag a PR that introduces a new alert. Fix the line and push, and the alert closes itself on the next run.

## A note on repository setup

Code scanning is free for public repositories. For private repositories it is part of GitHub Advanced Security, so if the upload step reports that code scanning is not enabled, that is the setting to check with your org admin. Nothing in OAuthLint changes here; this is GitHub's own gating on where alerts can be stored.

If you cannot use code scanning, OAuthLint also posts findings as inline PR annotations with zero extra setup or permissions. See [PR annotations](/docs/github-action#pr-annotations) on the GitHub Action page.

## Inputs and outputs used here

| Name | Type | Purpose |
|------|------|---------|
| `sarif` | input | Set to `'true'` to write a SARIF 2.1.0 report. Off by default. |
| `sarif-file` | input | Where to write it. Defaults to `oauthlint.sarif`. |
| `sarif-file` | output | The path of the report the run produced. Feed this to `upload-sarif`. |
| `fail-on` | input | Severity that fails the job, independent of the report. Defaults to `HIGH`. |

The full input and output tables live on the [GitHub Action](/docs/github-action) page.

## See also

- [GitHub Action](/docs/github-action): every input and output, plus inline PR annotations.
- [GitLab CI](/docs/gitlab-ci): the same SARIF report in a GitLab pipeline.
- [CLI reference](/docs/cli): the `--format sarif` flag the Action runs under the hood.
