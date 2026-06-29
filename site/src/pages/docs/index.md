---
layout: ../../layouts/DocsLayout.astro
title: "Getting started"
description: "Install and run OAuthLint in 30 seconds, read its findings, and wire it into CI: CLI, GitHub Action, and VS Code."
section: "getting-started"
---

# Getting started

OAuthLint scans your code for the OAuth 2.0 / OIDC / JWT / session / CORS anti-patterns that AI coding tools ship by default. It flags each one with a fix, before the code reaches a pull request.

## Run your first scan

No install, no config, no account. Point it at your source:

```bash
npx oauthlint scan ./src
```

It scans the directory, prints every finding it's confident about, and exits non-zero if anything fired. On clean, idiomatic auth code it stays silent, which is the whole point.

## Read a finding

Each finding is one line of signal:

```
CRITICAL  auth.jwt.no-verification  src/auth/session.ts:42
  Decoding a JWT does not verify its signature, so claims.sub can be forged.
  ✓ Fix: jwt.verify(token, key, { algorithms: ['RS256'] })
```

- **Severity**: `critical` · `high` · `medium` · `low` · `info`. Use it to decide what blocks CI.
- **Rule id**, for example `auth.jwt.no-verification`. Every rule has a page in the [rules catalogue](/rules) with a vulnerable and a safe example, mapped to CWE/OWASP.
- **Location**: `file:line`, so it's clickable in your terminal and editor.

## Fail CI on real issues

By default `scan` reports everything but only fails on findings. Gate your pipeline by severity:

```bash
# block the build on HIGH severity and above
npx oauthlint scan ./src --fail-on HIGH
```

See every flag in the [CLI reference](/docs/cli).

## Three ways to run it

OAuthLint meets your code where it already lives:

- **CLI / CI**: `npx oauthlint scan`, locally or in any pipeline. → [CLI reference](/docs/cli)
- **GitHub Action**: PR annotations and SARIF upload to GitHub code scanning. It's Docker-based, so it runs for any language. → [GitHub Action](/docs/github-action)
- **VS Code**: inline diagnostics as you type, with Quick Fix suppressions. → [VS Code extension](/docs/vscode)

## Tune it to your project

- **[Configuration](/docs/configuration)**: pin a severity floor, scope paths, and toggle rules with an `.oauthlintrc.yml`.
- **[Suppressing rules](/docs/suppressing)**: silence a single line with an auditable inline comment when you've made a deliberate exception.

> New here? Run `npx oauthlint scan ./src` on a real project first. The output is the fastest way to understand what OAuthLint catches.
