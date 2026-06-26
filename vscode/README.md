# oauthlint for VS Code

Catch the OAuth / OIDC / JWT anti-patterns AI coding tools produce, right in your
editor. oauthlint flags risky auth code as you save, with a one-click fix to
suppress a line and a link to the explanation for every rule.

## What it does

- **Inline diagnostics** on save and on open, for JavaScript and TypeScript.
- **Status bar item** showing the OAuthLint finding count for the active file
  (`$(shield) OAuthLint: 3`). It spins while a scan is running
  (`$(sync~spin) OAuthLint: scanning…`), turns into a `$(warning)` warning when
  the CLI can't be run (with a tooltip pointing at `oauthlint.cliPath`), and
  re-scans the current file when clicked. It hides for non-JS/TS files.
- **Quick Fix** to insert an `// oauthlint-disable-next-line` directive when a
  finding is a deliberate, reviewed choice.
- **Open rule docs** straight from a finding (each links to oauthlint.dev).

It runs the `oauthlint` CLI under the hood (which runs [Semgrep](https://semgrep.dev))
and renders its findings as native VS Code diagnostics.

## Requirements

This extension drives the oauthlint CLI, so you need it available:

```bash
npm install -g oauthlint        # or set "oauthlint.cliPath" to a local install
pipx install semgrep            # or: brew install semgrep
```

If the CLI is not found, the extension shows a one-time notice with setup steps.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `oauthlint.enabled` | `true` | Scan on save and on open |
| `oauthlint.minSeverity` | `MEDIUM` | Only surface findings at this severity or above |
| `oauthlint.cliPath` | _empty_ | Path to the oauthlint CLI (empty = use `oauthlint` on PATH) |
| `oauthlint.rulesDir` | _empty_ | Override the rules directory (empty = the CLI's built-in rules) |

## Commands

- **oauthlint: Scan current file**
- **oauthlint: Scan workspace**
- **oauthlint: Open rule documentation**

## Learn more

Full rule catalogue and guides at **[oauthlint.dev](https://oauthlint.dev)** ·
source on [GitHub](https://github.com/Auspeo/oauthlint).
