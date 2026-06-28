---
layout: ../../layouts/DocsLayout.astro
title: "GitLab CI"
description: "Run OAuthLint in a GitLab pipeline. A ready-to-use .gitlab-ci.yml that installs Semgrep, scans for OAuth / OIDC / JWT anti-patterns, gates on severity, and publishes a SARIF report as an artifact."
section: "gitlab-ci"
---

# GitLab CI

Run OAuthLint in a GitLab pipeline to catch OAuth / OIDC / JWT anti-patterns on every push and merge request. There is no GitLab-specific component to install. The pipeline runs the same CLI you would run locally, gates on a severity you choose, and saves a SARIF report you can download or, on GitLab Ultimate, surface in the Security tab.

## Ready-to-use pipeline

Add this to your `.gitlab-ci.yml`. It installs Semgrep, writes a SARIF report, and fails the pipeline on HIGH-and-above findings.

```yaml
stages:
  - test

oauthlint:
  stage: test
  image: node:20-bookworm
  before_script:
    # Semgrep must be on PATH. OAuthLint is a wrapper around a Semgrep rule pack.
    - apt-get update && apt-get install -y --no-install-recommends python3-pip
    - pip install --break-system-packages semgrep
  script:
    # 1. Write a SARIF report. --fail-on off so this pass never fails on its own.
    - npx --yes oauthlint scan . --format sarif --fail-on off > oauthlint.sarif
    # 2. Gate the pipeline. Surface MEDIUM+ in the log, fail only on HIGH+.
    - npx --yes oauthlint scan . --severity MEDIUM --fail-on HIGH
  artifacts:
    when: always   # keep the report even when the gating step fails
    expire_in: 30 days
    paths:
      - oauthlint.sarif
```

A copy of this file lives in the repository under [`examples/gitlab-ci/.gitlab-ci.yml`](https://github.com/Auspeo/oauthlint/blob/main/examples/gitlab-ci/.gitlab-ci.yml).

## Why two scan steps

The job scans twice on purpose, and each pass has a different job.

The first pass writes the SARIF report with `--fail-on off`. That guarantees the report is produced whether or not findings exist, so it is always there to download. The second pass is the gate: it prints findings at MEDIUM and above to the log and sets a non-zero exit code only when something reaches HIGH. GitLab fails the job on that exit code.

Keeping them separate means a failing pipeline still leaves you a complete report, and the human-readable findings show up in the job log rather than only inside the SARIF file. `artifacts: when: always` is what preserves the report across a failing job.

If you only want a report and never want OAuthLint to fail the pipeline, drop the second step and change the first to `--fail-on off` (which it already is). If you want to gate harder, lower `--fail-on` to `MEDIUM`.

## Installing Semgrep

OAuthLint drives Semgrep, so Semgrep has to be on `PATH` in the job. The snippet uses a `node:20-bookworm` image and installs Semgrep with pip. The `--break-system-packages` flag is needed because Debian marks its Python as externally managed; installing into the job's throwaway container is exactly the case that flag is for.

If you maintain your own CI base image, bake Node 20 and Semgrep into it and drop the `before_script`. The scan itself is just `npx oauthlint scan`.

## Publishing the report

The `artifacts: paths` block keeps `oauthlint.sarif` after the job. Anyone can open the job in GitLab and download it under the job's artifacts, and you can wire it into later stages. This works on every GitLab tier, including Free.

To attach a JSON report instead of, or alongside, SARIF, add a pass with `--format json`:

```yaml
  script:
    - npx --yes oauthlint scan . --format json --fail-on off > oauthlint.json
    - npx --yes oauthlint scan . --severity MEDIUM --fail-on HIGH
  artifacts:
    when: always
    paths:
      - oauthlint.json
```

## Surfacing findings in the Security tab (Ultimate)

GitLab can ingest a SARIF 2.1.0 file into its native security features, but this is an Ultimate-tier capability and needs GitLab 19.2 or newer (it was introduced earlier, in 18.11, and became generally available in 19.2). On a qualifying instance, add a `reports: sarif:` key pointing at the same file:

```yaml
  artifacts:
    when: always
    expire_in: 30 days
    paths:
      - oauthlint.sarif
    reports:
      sarif: oauthlint.sarif
```

With that in place, OAuthLint findings appear in the pipeline Security tab, the project vulnerability report, the security dashboard, and the merge request security widget. GitLab maps the SARIF severity and `security-severity` that OAuthLint already sets, so alerts sort the way they do in the report.

GitLab's SARIF ingestion has a few limits worth knowing: the report must be SARIF 2.1.0 (OAuthLint emits exactly that), the artifact is capped at 10 MB by default, and a single file may hold up to 20 runs and 5,000 results per run. A normal OAuthLint scan sits well inside those bounds.

### Be honest about tiers

If your project is on Free or Premium, the `reports: sarif:` ingestion is not available to you, and adding the key will not populate the Security tab. That is a GitLab licensing boundary, not an OAuthLint limitation. On those tiers, use the downloadable `artifacts: paths` report from the main snippet above, which works everywhere, and gate the pipeline on the exit code as shown.

## Scan only what changed

On a large repository you can scan just the files a merge request touches by adding `--diff` against the target branch. This is faster and keeps the gate focused on new code:

```yaml
  script:
    - npx --yes oauthlint scan . --diff origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME --fail-on HIGH
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

Fetch the target branch first if your CI clones shallow. See the [CLI reference](/docs/cli) for `--diff`, `--staged`, and baselines.

## See also

- [CLI reference](/docs/cli): every flag the pipeline runs, and the exit codes GitLab gates on.
- [GitHub code scanning](/docs/code-scanning): the same SARIF report in a GitHub workflow.
- [Configuration](/docs/configuration): scope paths and toggle rules with an `.oauthlintrc.yml` the scan picks up automatically.
