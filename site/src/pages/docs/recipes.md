---
layout: ../../layouts/DocsLayout.astro
title: "Recipes"
description: "A copy-paste integration cookbook for OAuthLint — gate PRs and upload SARIF, inline annotations, pre-commit, Semgrep one-liners, baselines, changed-files scans, HTML reports, Docker/CI, and editors."
section: "recipes"
---

# Recipes

A cookbook of copy-paste integrations. Each recipe is one snippet you can drop in as-is. For the full flag set and behaviour behind these, see the [CLI reference](/docs/cli) and the [GitHub Action](/docs/github-action) docs.

## GitHub Action — gate PRs + upload SARIF to Code Scanning

Fail the job on HIGH+ findings and surface them in the **Security → Code scanning** tab as inline annotations.

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
          fail-on: 'HIGH'

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: ${{ steps.oauthlint.outputs.sarif-file }}
```

> The SARIF pass never fails the job on its own — gating is controlled solely by `fail-on`. `if: always()` ensures the upload still runs when findings exist.

## GitHub Action — inline PR annotations

Annotations are **on by default** (`annotations: 'true'`) — no token, no extra permission, no SARIF upload required.

```yaml
- uses: actions/checkout@v4
- uses: Auspeo/oauthlint@v1
  with:
    fail-on: HIGH
```

> Each finding becomes a workflow-command annotation (`::error` for HIGH/CRITICAL, `::warning` below) that renders inline on the PR's *Files changed* tab, plus a Markdown job summary. Opt out with `annotations: 'false'`.

## pre-commit hook

Scan only the files each commit touches, before they leave your machine. Add OAuthLint to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/Auspeo/oauthlint
    rev: oauthlint@0.4.0
    hooks:
      - id: oauthlint
        args: [--fail-on, HIGH]
```

> Then run `pre-commit install`. The hook needs Node (≥ 20) and Semgrep on `PATH`; omit `args` to report without blocking. See [pre-commit](/docs/pre-commit).

## Run from Semgrep — no install

Already have [Semgrep](https://semgrep.dev)? Run the entire pack with one command — no install, no config file, no account:

```bash
semgrep --config https://oauthlint.dev/r/oauthlint.yaml ./src
```

Only care about one language? Point Semgrep at the matching bundle:

```bash
semgrep --config https://oauthlint.dev/r/oauthlint-javascript.yaml ./src
semgrep --config https://oauthlint.dev/r/oauthlint-typescript.yaml ./src
semgrep --config https://oauthlint.dev/r/oauthlint-python.yaml ./src
semgrep --config https://oauthlint.dev/r/oauthlint-go.yaml ./src
semgrep --config https://oauthlint.dev/r/oauthlint-java.yaml ./src
semgrep --config https://oauthlint.dev/r/oauthlint-rust.yaml ./src
```

> The hosted URL is always the latest pack. For a pinned ruleset in CI, use `npx oauthlint@<version> scan` instead. See [Use with Semgrep](/docs/semgrep).

## Adopt on a large existing repo with a baseline

Capture today's findings, then have CI fail only on **new** ones while you work the backlog down separately.

```bash
# 1. record the current findings to .oauthlint-baseline.json (commit this file)
npx oauthlint baseline ./src

# 2. in CI, report only findings absent from the baseline
npx oauthlint scan ./src --baseline --fail-on HIGH
```

> `--baseline` reads `.oauthlint-baseline.json` by default; pass a path to override. See [`baseline`](/docs/cli#baseline).

## Scan only changed files

Skip the rest of the tree for fast CI and pre-commit by scanning just what changed:

```bash
# files changed versus the default branch (great for CI on large repos)
npx oauthlint scan --diff

# git-staged files only (pre-commit)
npx oauthlint scan --staged
```

> `--diff` defaults to the merge-base with the default branch; pass a ref (`--diff main`) to compare against another. Outside a git repo it errors clearly.

## Generate a shareable HTML report

Render a self-contained, offline, no-JavaScript audit you can email or attach to a PR:

```bash
npx oauthlint scan ./src --format html > oauthlint-report.html
```

> `--format sarif` and `--format json` work the same way for machine-readable output.

## Use in any CI (Docker, no Node project changes)

No `package.json` change needed — run the published CLI on demand with `npx`:

```bash
pipx install semgrep                              # the engine OAuthLint drives
npx oauthlint@latest scan ./src --fail-on HIGH
```

> Semgrep must be on `PATH` (`pipx install semgrep` or `brew install semgrep`); without it the scan exits `127`. For a turnkey, Docker-based job with SARIF upload, prefer the [GitHub Action](/docs/github-action).

## Cursor / Windsurf

Editors that pull extensions from [Open VSX](https://open-vsx.org/extension/auspeo/oauthlint-vscode) — like Cursor and Windsurf — get the same extension as VS Code. Search **oauthlint** in the Extensions view, or:

```bash
code --install-extension auspeo.oauthlint-vscode
```

> The extension shells out to the `oauthlint` CLI, so install the CLI (`npm install -g oauthlint`) and Semgrep too. See [VS Code extension](/docs/vscode).
