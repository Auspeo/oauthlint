---
layout: ../../layouts/DocsLayout.astro
title: "VS Code extension"
description: "Run OAuthLint inside VS Code — inline diagnostics on save, a Quick Fix to suppress a line, and a link to the docs for every rule."
section: "vscode"
---

# VS Code extension

OAuthLint surfaces auth findings as native VS Code diagnostics, with a one-click Quick Fix to suppress a reviewed line and a link to the explanation for every rule.

## Install

Install **oauthlint** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=auspeo.oauthlint-vscode) — search **oauthlint** in the Extensions view (⇧⌘X / Ctrl+Shift+X), or from a terminal:

```bash
code --install-extension auspeo.oauthlint-vscode
```

Publisher / extension id: **`auspeo.oauthlint-vscode`**. Early (`0.2.x`) but functional.

### Requirement: the CLI

The extension is a thin front-end over the [`oauthlint` CLI](/docs/cli) — it shells out to it and renders the JSON findings. You need the CLI (and Semgrep) available:

```bash
npm install -g oauthlint        # or point oauthlint.cliPath at a local install
pipx install semgrep            # or: brew install semgrep
```

If the CLI can't be found, the extension shows a one-time warning with a link to the setup guide rather than failing silently.

## What it does

- **Inline diagnostics** for JavaScript, JSX, TypeScript and TSX. A scan runs when you **save** or **open** a file (debounced, and re-run when you change a setting). Severity maps to the editor's familiar squiggles: `CRITICAL` and `HIGH` show as errors, `MEDIUM` as a warning, `LOW` and `INFO` as information.
- **Rule id + docs link on every finding.** Each diagnostic carries its rule id (e.g. `auth.jwt.no-verification`) and a link straight to that rule's page on oauthlint.dev.
- **Quick Fix → suppress this line.** On any finding, the lightbulb offers **Suppress `<rule-id>` on this line**, which inserts an `// oauthlint-disable-next-line <rule-id>` directive above the offending line — the same auditable comment the CLI honours. See [Suppressing rules](/docs/suppressing).
- **Quick Fix → open documentation.** A second action, **Open documentation for `<rule-id>`**, opens the rule's docs in your browser.
- **Status bar item.** A shield in the status bar shows the finding count for the active file, spins while a scan runs, and turns into a warning (pointing at `oauthlint.cliPath`) when the CLI can't be run. Click it to re-scan the current file. It hides for non-JS/TS files.

## Settings

All settings live under the `oauthlint` namespace (**Settings** → search "oauthlint"):

| Setting | Default | Description |
|---------|---------|-------------|
| `oauthlint.enabled` | `true` | Run OAuthLint on save (and on open). Set `false` to disable scanning. |
| `oauthlint.minSeverity` | `MEDIUM` | Only surface findings at this severity or above. One of `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `oauthlint.cliPath` | _empty_ | Path to the `oauthlint` CLI. Empty means use `oauthlint` from your `PATH`. |
| `oauthlint.rulesDir` | _empty_ | Override the rules directory passed to the CLI (maps to `--rules-dir`). Empty means the CLI's built-in rules. |

## Commands

Available from the Command Palette (all prefixed **OAuthLint:**):

| Command | Id | Action |
|---------|----|--------|
| OAuthLint: Scan current file | `oauthlint.scanFile` | Scan the active editor's file now. |
| OAuthLint: Scan workspace | `oauthlint.scanWorkspace` | Scan the first workspace folder. |
| OAuthLint: Open rule documentation | `oauthlint.openDoc` | Open a rule's docs page (used by the Quick Fix). |

## Relationship to the CLI and config

The extension runs `oauthlint scan <target> --json` with the workspace folder as the working directory, so it uses the **same rule pack and the same [`.oauthlintrc`](/docs/configuration)** the CLI would pick up there — no separate configuration. Two differences to note:

- It scans with `--fail-on off` (the editor never needs an exit code), so your config's `failOn` doesn't affect what the extension shows. Use `oauthlint.minSeverity` to set the editor's noise floor instead.
- `oauthlint.rulesDir` is forwarded as `--rules-dir`, mirroring the CLI flag for custom rule packs.

For CI gating and the full flag set, see the [CLI reference](/docs/cli).
