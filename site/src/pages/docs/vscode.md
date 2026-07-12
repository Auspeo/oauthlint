---
layout: ../../layouts/DocsLayout.astro
title: "VS Code extension"
description: "Run OAuthLint inside VS Code: inline diagnostics on save, a Quick Fix to apply or suppress a finding, and a link to the docs for every rule. Nothing to install beyond the extension."
section: "vscode"
---

# VS Code extension

OAuthLint surfaces auth findings as native VS Code diagnostics, with Quick Fixes to apply a finding's autofix or suppress a reviewed line, and a link to the explanation for every rule.

## Install

Install **oauthlint** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=auspeo.oauthlint-vscode). Search **oauthlint** in the Extensions view (⇧⌘X / Ctrl+Shift+X), or install it from a terminal:

```bash
code --install-extension auspeo.oauthlint-vscode
```

Publisher / extension id: **`auspeo.oauthlint-vscode`**.

Using an AI coding editor that pulls from **[Open VSX](https://open-vsx.org/extension/auspeo/oauthlint-vscode)** instead of the VS Code Marketplace, like **Cursor** or **Windsurf** (and others)? The extension is published there too under the same `auspeo.oauthlint-vscode` id; search **oauthlint** in the Extensions view.

### Nothing else to install

The extension is self-contained. The full rule pack ships inside it, and the scan engine (**Opengrep**, a self-contained single binary that runs the same rules as Semgrep) is downloaded automatically the first time you scan. That is a one-time download of about 41 MB, verified against a pinned checksum, then cached in the extension's storage and reused. There is no separate CLI, Semgrep, or Python to install.

If you already run `opengrep` or `semgrep` on your machine, point `oauthlint.enginePath` at it to skip the download. If the one-time download fails (for example on an offline first run), the extension shows a notice with a **Retry** action rather than failing silently.

## What it does

- **Inline diagnostics** for JavaScript, JSX, TypeScript and TSX. A scan runs when you **save** or **open** a file (debounced, and re-run when you change a setting). Severity maps to the editor's familiar squiggles: `CRITICAL` and `HIGH` show as errors, `MEDIUM` as a warning, `LOW` and `INFO` as information.
- **Rule id + docs link on every finding.** Each diagnostic carries its rule id (e.g. `auth.jwt.no-verification`) and a link straight to that rule's page on oauthlint.dev.
- **Quick Fix → apply the fix.** When a finding ships a safe autofix, the lightbulb offers **Apply OAuthLint fix for `<rule-id>`** (marked as the preferred action). It rewrites just the offending span in place, the same deterministic replacement the CLI's [`--fix`](/docs/cli#scan) applies, without touching the rest of the file. Findings without a fix don't show this action.
- **Quick Fix → suppress this line.** On any finding, the lightbulb offers **Suppress `<rule-id>` on this line**, which inserts an `// oauthlint-disable-next-line <rule-id>` directive above the offending line, the same auditable comment the CLI honours. See [Suppressing rules](/docs/suppressing).
- **Quick Fix → open documentation.** A second action, **Open documentation for `<rule-id>`**, opens the rule's docs in your browser.
- **Status bar item.** A shield in the status bar shows the finding count for the active file, spins while a scan runs, and turns into a warning when a scan can't run (with a tooltip pointing at the OAuthLint output channel). Click it to re-scan the current file. It hides for non-JS/TS files.

## Settings

All settings live under the `oauthlint` namespace (**Settings** → search "oauthlint"):

| Setting | Default | Description |
|---------|---------|-------------|
| `oauthlint.enabled` | `true` | Run OAuthLint on save (and on open). Set `false` to disable scanning. |
| `oauthlint.minSeverity` | `MEDIUM` | Only surface findings at this severity or above. One of `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `oauthlint.enginePath` | _empty_ | Path to an existing `opengrep` or `semgrep` binary to use instead of the auto-managed download. Empty means the extension downloads and caches its own engine. |
| `oauthlint.rulesDir` | _empty_ | Override the rule pack used for scanning. Empty means the rule pack bundled with the extension. |

## Commands

Available from the Command Palette (all prefixed **OAuthLint:**):

| Command | Id | Action |
|---------|----|--------|
| OAuthLint: Scan current file | `oauthlint.scanFile` | Scan the active editor's file now. |
| OAuthLint: Scan workspace | `oauthlint.scanWorkspace` | Scan the first workspace folder. |
| OAuthLint: Open rule documentation | `oauthlint.openDoc` | Open a rule's docs page (used by the Quick Fix). |
| OAuthLint: Retry scan engine setup | `oauthlint.retryEngineSetup` | Re-attempt the one-time engine download after a failure. |

## Relationship to the CLI

The editor and the [`oauthlint` CLI](/docs/cli) run the **same rule pack** on the same engine family, so a finding you see on save is the finding the CLI and [GitHub Action](/docs/github-action) gate on in CI. The difference is packaging: the extension bundles the rules and manages its own engine so it runs with zero setup, while the CLI is the tool you wire into scripts and pipelines.

A couple of things follow from that:

- The extension scans in process and never needs an exit code, so `oauthlint.minSeverity` (not a config file's `failOn`) sets the editor's noise floor.
- `oauthlint.rulesDir` points the editor at a custom rule pack, mirroring the CLI's `--rules-dir`.

For CI gating, `.oauthlintrc` configuration, and the full flag set, see the [CLI reference](/docs/cli).
