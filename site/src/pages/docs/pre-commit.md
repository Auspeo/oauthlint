---
layout: ../../layouts/DocsLayout.astro
title: "pre-commit"
description: "Run OAuthLint as a pre-commit framework hook — scan only the files a commit is about to capture, and catch OAuth / OIDC / JWT anti-patterns before they leave your machine."
section: "pre-commit"
---

# pre-commit

Wire OAuthLint into the [pre-commit](https://pre-commit.com) framework so every commit is scanned for OAuth / OIDC / JWT anti-patterns — but only across the files that commit actually touches, not your whole tree.

## Quick usage

Add OAuthLint to your `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/Auspeo/oauthlint
    rev: oauthlint@0.4.0
    hooks:
      - id: oauthlint
```

> Pin `rev` to a published [release tag](https://github.com/Auspeo/oauthlint/releases) (the hook installs that exact version); point it at `main` only to track unreleased changes.

Then install the hook and you're done:

```bash
pre-commit install
```

From now on `git commit` runs OAuthLint against the staged source files. The hook reports every finding but does **not** block the commit by default — add gating yourself (see [Fail the commit](#fail-the-commit-on-real-issues) below) when you're ready to enforce.

## Prerequisites

The hook is honest about two things it needs on the machine running the commit:

- **Node.js (≥ 20).** OAuthLint is published as the `oauthlint` npm package. The hook is declared `language: node`, so pre-commit creates an isolated Node environment, installs the pinned `oauthlint` package into it (via `additional_dependencies`), and runs its `oauthlint` bin — you don't add `oauthlint` to your project's `package.json`. But pre-commit still needs a Node toolchain available to build that environment.
- **Semgrep on `PATH`.** OAuthLint is a wrapper around a Semgrep rule pack; Semgrep is the engine it drives. Install it once with `pipx install semgrep` or `brew install semgrep`. If Semgrep is missing, the scan exits `127` and your commit fails with a clear message rather than passing silently.

> If your team can't guarantee Node and Semgrep on every contributor's machine, gate in CI with the [GitHub Action](/docs/github-action) instead — it's Docker-based and needs no local toolchain.

## How it runs only on staged files

pre-commit passes the staged files to the hook as positional arguments, and the hook runs `oauthlint scan <file> <file> …` against exactly that list. So a commit that only touches `src/auth.ts` scans `src/auth.ts` — not the rest of the repository. That keeps the hook fast enough to sit in the commit path.

The hook is scoped to the source extensions OAuthLint understands — `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.java`, `.rs` — via `types_or`, so a commit that only changes Markdown, lockfiles or images skips the scan entirely. When no staged file matches, pre-commit doesn't run the hook at all.

## Fail the commit on real issues

By default the hook reports findings but stays out of your way. To block commits on findings at or above a severity, pass `--fail-on` through `args`:

```yaml
repos:
  - repo: https://github.com/Auspeo/oauthlint
    rev: oauthlint@0.4.0
    hooks:
      - id: oauthlint
        args: [--fail-on, HIGH]
```

Any flag the CLI accepts can go in `args` the same way — for example `[--severity, MEDIUM, --fail-on, HIGH]` to surface MEDIUM+ in the output but only block on HIGH+. See the [CLI reference](/docs/cli) for the full list and the [exit codes](/docs/cli) the hook honours.

## Run it on demand

The hook only fires on staged files during a commit. To scan everything once — useful right after you add the hook — run:

```bash
pre-commit run oauthlint --all-files
```

## Keeping it current

`rev` pins the OAuthLint release the hook installs. Bump it with:

```bash
pre-commit autoupdate --repo https://github.com/Auspeo/oauthlint
```

## See also

- [CLI reference](/docs/cli) — every flag the hook can pass through `args`, and the exit codes it returns.
- [Configuration](/docs/configuration) — scope paths and toggle rules with an `.oauthlintrc.yml` the scan picks up automatically.
- [GitHub Action](/docs/github-action) — the same checks in CI, Docker-based, with no local Node or Semgrep required.
