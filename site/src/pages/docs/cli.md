---
layout: ../../layouts/DocsLayout.astro
title: "CLI reference"
description: "Every OAuthLint command and flag — scan, list, init, doctor — with accepted values, defaults, exit codes and CI examples."
section: "cli"
---

# CLI reference

The `oauthlint` CLI scans your code for OAuth / OIDC / JWT / session / CORS anti-patterns, lists the shipped rules, scaffolds a config, and diagnoses your install. Run it with `npx oauthlint <command>` — no install required. Every scan invokes [Semgrep](/docs/github-action) under the hood, so it must be on `PATH`.

## `scan`

Scan a directory for auth misconfigurations.

```bash
npx oauthlint scan [path]
```

The `path` argument is the directory (or file) to scan. It is optional and defaults to `.` (the current directory). You can pass **several paths/files** at once.

```bash
# scan the current directory
npx oauthlint scan

# scan a specific path
npx oauthlint scan ./src

# scan several files (e.g. from a pre-commit hook)
npx oauthlint scan src/auth.ts src/server.ts

# scan only what changed (fast CI + pre-commit)
npx oauthlint scan --diff          # files changed vs the default branch
npx oauthlint scan --staged        # git-staged files only
```

### Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--format <fmt>` | `pretty` \| `json` \| `sarif` | `pretty` | Output format. `sarif` emits a SARIF report for GitHub Code Scanning. |
| `--json` | — | off | Shortcut for `--format json`. When both are set, `--format` wins. |
| `--severity <level>` | `INFO` \| `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` | none | Only emit findings at or above this severity. Filters output; case-insensitive. |
| `--fail-on <level>` | `INFO` \| `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` \| `off` | `HIGH` | Exit non-zero when any finding meets or exceeds this severity. `off` never fails the build. Falls back to `failOn` in your config, then `HIGH`. Case-insensitive. |
| `--rules-dir <path>` | filesystem path | bundled rules | Override the bundled rule pack with a custom rules directory. |
| `--fix` | — | off | Apply auto-fixes, rewriting source in place where a rule ships a fix template (currently the `auth.cookie.*` rules). |
| `--diff [<ref>]` | git ref | merge-base with the default branch | Scan only files changed versus `<ref>`. Great for CI on large repos — only new code is scanned. Outside a git repo, errors clearly. |
| `--staged` | — | off | Scan only git-staged files. Used by the [pre-commit hook](/docs/pre-commit). |

A few details worth knowing:

- `--severity` controls **what is printed**; `--fail-on` controls **what fails the build**. They are independent.
- `--severity` and `--fail-on` accept any case (`high`, `HIGH`); an unrecognised value is rejected with an error.
- Inline `oauthlint-disable` suppressions are applied before the severity filter — see [Suppressing rules](/docs/suppressing).
- Config-file values (`failOn`, `customRulesDir`, path scoping) are read from `.oauthlintrc.yml` and overridden by the matching flag. See [Configuration](/docs/configuration).

```bash
# only show HIGH and above
npx oauthlint scan ./src --severity HIGH

# machine-readable output
npx oauthlint scan ./src --json

# SARIF for GitHub Code Scanning
npx oauthlint scan ./src --format sarif > oauthlint.sarif

# never fail the build (CI dry-run)
npx oauthlint scan ./src --fail-on off

# auto-apply safe fixes
npx oauthlint scan ./src --fix
```

## `list`

List every rule the current install ships with. Pretty output shows severity, an `LLM↑` marker for rules with high LLM prevalence, the rule id and its OAuthLint id.

```bash
# pretty listing
npx oauthlint list

# machine-readable
npx oauthlint list --json
```

Browse the same catalogue with vulnerable/safe examples and CWE/OWASP mappings in the [rules catalogue](/rules).

## `init`

Generate a `.oauthlintrc.yml` in the current directory. Refuses to overwrite an existing file unless you pass `-f` / `--force`.

```bash
# scaffold a config
npx oauthlint init

# overwrite an existing config
npx oauthlint init --force
```

See [Configuration](/docs/configuration) for the full file format.

## `doctor`

Diagnose your OAuthLint install. It checks the Node.js runtime (≥ v20), that the Semgrep CLI is on `PATH`, and that the rule pack loads.

```bash
# pretty environment check
npx oauthlint doctor

# machine-readable
npx oauthlint doctor --json
```

## Exit codes

`scan` sets the process exit code so CI can gate on it. A finding only affects the exit code when it meets the `--fail-on` threshold (default `HIGH`).

| Code | When |
|:----:|------|
| `0` | No finding at or above the `--fail-on` threshold (or `--fail-on off`). |
| `1` | A finding meets the threshold and the worst severity present is `HIGH`. |
| `2` | A finding meets the threshold and the worst severity present is `CRITICAL`, **or** the scan output could not be parsed (it never silently exits clean). |
| `127` | Semgrep is not installed. |

`list`, `init`, and `doctor` exit `0` on success. `init` exits `1` if the config already exists and `--force` was not passed; `doctor` exits `1` if any check fails.

> Note: because `--fail-on` gates on the threshold but the failing code reflects the *worst severity present*, a run whose worst finding is `MEDIUM` or below exits `0` even with `--fail-on MEDIUM`. To block on lower-severity findings, treat any non-empty `--json` output as a failure in your pipeline.

## CI examples

Fail the build on HIGH-and-above findings:

```bash
#!/usr/bin/env bash
set -euo pipefail

pipx install semgrep            # the engine OAuthLint runs
npx oauthlint scan ./src --fail-on HIGH
```

Upload SARIF to GitHub Code Scanning so findings annotate the PR:

```bash
#!/usr/bin/env bash
set -euo pipefail

pipx install semgrep
# --fail-on off so the SARIF upload step still runs even when findings exist
npx oauthlint scan ./src --format sarif --fail-on off > oauthlint.sarif
```

For a turnkey GitHub workflow that runs the scan and uploads SARIF, use the [GitHub Action](/docs/github-action).
