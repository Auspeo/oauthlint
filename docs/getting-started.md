# Getting started

oauthlint scans your code for the OAuth, OIDC and JWT mistakes that AI coding
tools tend to write, and links every finding to a fix. This page takes you from
zero to a clean CI in a few minutes.

## Prerequisites

oauthlint runs on [Semgrep](https://semgrep.dev), so you need it on the machine
that runs the scan:

```bash
pipx install semgrep      # or: brew install semgrep
```

Check your setup at any time:

```bash
npx oauthlint doctor
```

## Your first scan

No install required:

```bash
npx oauthlint scan ./src
```

Each finding shows the rule, the exact file and line, why it is dangerous, and a
link to a page explaining the fix:

```text
 ERROR  auth.jwt.alg-none (AUTH-JWT-001)
   src/auth.ts:14
   A forged token would pass: alg: none is allowed.
   📖 https://oauthlint.dev/rules/jwt-alg-none
```

Severity runs `ERROR` → `WARNING` → `INFO`. By default the scan reports
everything and exits non-zero when it finds `HIGH`-impact issues.

## Fail your CI on real problems

Pick the threshold that should break the build:

```bash
npx oauthlint scan ./src --fail-on HIGH
```

## Output formats

```bash
npx oauthlint scan ./src --json                       # machine-readable
npx oauthlint scan ./src --format sarif > out.sarif   # GitHub Code Scanning
```

Upload the SARIF file with `github/codeql-action/upload-sarif` to see findings in
the **Security** tab of your repo.

## Auto-fix the safe ones

Some fixes are mechanical (for example, adding cookie flags). Apply them with:

```bash
npx oauthlint scan ./src --fix
```

Everything else links to a documented fix you apply yourself.

## Suppress a finding on purpose

Sometimes a finding is a deliberate, reviewed choice. Suppress a single line and
say why:

```ts
// oauthlint-disable-next-line auth.jwt.alg-none -- legacy token, removed in Q2
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });
```

Wholesale silencing of a whole file or rule is intentionally not supported: the
next reviewer should see exactly which lines opted out, and why.

## In your CI (GitHub Action)

The Action is Docker-based, so it runs whatever language your repo uses:

```yaml
name: oauthlint
on: [pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Auspeo/oauthlint/action@v1
        with:
          severity: HIGH
          fail-on: HIGH
```

## In your editor (VS Code)

Install the **oauthlint** extension from the Marketplace for inline diagnostics
as you type, with a Quick Fix to suppress a line.

## Configuration

Generate a config file to tune severity, paths, and suppressions:

```bash
npx oauthlint init
```

## Next steps

- Browse the [full rule catalogue](/rules/).
- Found a false positive or want a new rule? See
  [Contributing](https://github.com/Auspeo/oauthlint/blob/main/CONTRIBUTING.md).
