---
layout: ../../layouts/DocsLayout.astro
title: "Configuration"
description: "Configure OAuthLint with an .oauthlintrc file — scope paths, toggle rules, set a severity floor, and load custom rules."
section: "configuration"
---

# Configuration

OAuthLint runs with zero config, but an `.oauthlintrc` file lets you scope which files are scanned, tune individual rules, and pin the severity that fails your build.

## Where OAuthLint looks

Configuration is optional. With no config file, OAuthLint scans with sensible defaults (`failOn: HIGH`, every rule enabled). When you do add one, OAuthLint searches upward from the scan directory and uses the first of these it finds:

```
.oauthlintrc
.oauthlintrc.json
.oauthlintrc.yml
.oauthlintrc.yaml
oauthlint.config.js
oauthlint.config.mjs
oauthlint.config.cjs
package.json   (under an "oauthlint" key)
```

The list above is the precedence order; the first match wins. Put the file at your repo root so it applies to the whole project.

## Scaffold a config

Generate a starter `.oauthlintrc.yml` in the current directory:

```bash
npx oauthlint init
```

It won't overwrite an existing file. Pass `--force` if you want it to:

```bash
npx oauthlint init --force
```

## A full `.oauthlintrc.yml`

Every supported field, annotated:

```yaml
# OAuthLint config

# Config schema version. Defaults to 1.
version: 1

# Glob(s) of files to scan. When omitted, OAuthLint scans the path you
# pass on the command line with its built-in defaults.
include:
  - "src/**/*.{ts,tsx,js,jsx,mjs,cjs}"

# Glob(s) to skip. Applied on top of include.
exclude:
  - "**/*.test.{ts,tsx,js,jsx}"
  - "**/*.spec.{ts,tsx,js,jsx}"
  - "node_modules/**"
  - "dist/**"
  - "build/**"

# Per-rule overrides, keyed by rule id:
#   off    → disable the rule entirely
#   warn   → emit the finding but never affect the exit code
#   <SEV>  → override the rule's severity
#            (INFO | LOW | MEDIUM | HIGH | CRITICAL)
rules:
  auth.cookie.no-samesite: warn
  auth.session.id-in-url: off
  auth.jwt.alg-none: CRITICAL

# Load extra rules from this directory, in addition to the bundled pack.
customRulesDir: ./security/oauthlint-rules

# Exit-code policy: the run fails when any finding at or above this
# severity is present. Use "off" to never fail the run. Defaults to HIGH.
failOn: HIGH
```

## The fields

| Field | Type | Default | What it does |
|-------|------|---------|--------------|
| `version` | number | `1` | Config schema version. |
| `include` | string[] | _(none)_ | Globs of files to scan. Omit to scan the CLI path with built-in defaults. |
| `exclude` | string[] | _(none)_ | Globs to skip, applied on top of `include`. |
| `rules` | map | _(none)_ | Per-rule overrides keyed by rule id. Each value is `off`, `warn`, or a severity (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). |
| `customRulesDir` | string | _(none)_ | Directory of extra rules loaded alongside the bundled pack. |
| `failOn` | severity \| `off` | `HIGH` | Severity floor for a failing exit code. `off` never fails the run. |

### `rules` values

- `off` disables the rule; it never fires.
- `warn` keeps emitting the finding, but it never contributes to the failing exit code (regardless of `failOn`).
- a severity (`INFO` / `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`) overrides the rule's built-in severity, which in turn affects whether it crosses your `failOn` threshold.

## Config vs CLI flags

CLI flags win. A `--fail-on` passed on the command line overrides the `failOn` in your config file for that run, so CI can tighten or relax the gate without editing the config:

```bash
# config says failOn: HIGH, but never fail this run
npx oauthlint scan ./src --fail-on off
```

See the [CLI reference](/docs/cli) for every flag.

## Related

- [CLI reference](/docs/cli): every command and flag.
- [Suppressing rules](/docs/suppressing): silence a single line with an auditable inline comment instead of disabling a rule project-wide.
