# OAuthLint — VS Code extension

Real-time OAuth / OIDC / JWT linting inside VS Code.

The extension shells out to the `oauthlint` CLI (which itself
runs Semgrep under the hood), parses its JSON report, and surfaces each
finding as a VS Code diagnostic. Hover shows the message; the Quick Fix
menu offers a one-click "Suppress this rule on this line" action that
inserts an `// oauthlint-disable-next-line` directive.

## Prerequisites

- Node.js ≥ 20
- The `oauthlint` CLI on PATH (`pnpm install` in the monorepo root will
  link it into `node_modules/.bin/`)
- Semgrep installed (`brew install semgrep` or `pipx install semgrep`)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `oauthlint.enabled` | `true` | Run OAuthLint on save / on open |
| `oauthlint.minSeverity` | `MEDIUM` | Severity floor for surfaced findings |
| `oauthlint.cliPath` | _empty_ | Override path to the oauthlint binary |
| `oauthlint.rulesDir` | _empty_ | Override the bundled rule pack |

## Commands

- `OAuthLint: Scan current file`
- `OAuthLint: Scan workspace`
- `OAuthLint: Open rule documentation` (target URL passed as argument)

## Development

```bash
pnpm install
pnpm --filter oauthlint-vscode build
# then in VS Code:  F5  to launch an Extension Development Host
```

## Marketplace publishing

Deliberately deferred until the wider project leaves "private mode". The
manifest is ready; we just don't `vsce publish` yet.
