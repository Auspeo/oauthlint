# oauthlint

> Catch the OAuth/OIDC/JWT anti-patterns AI coding tools systematically produce.

CLI wrapper around [`oauthlint-rules`](../oauthlint-rules) — a Semgrep
rule pack curated by an IAM engineer.

## Quick start

```bash
npx oauthlint scan ./src
```

You need [Semgrep](https://semgrep.dev/docs/getting-started/) installed
(`pipx install semgrep` or `brew install semgrep`). The CLI invokes it
under the hood and normalises the output for humans and CI.

## Commands

```
oauthlint scan [path]           Scan a directory (default: current dir)
oauthlint scan --json           Emit machine-readable JSON
oauthlint scan --severity HIGH  Only show findings ≥ HIGH
oauthlint scan --fail-on off    Never fail the build (CI dry-run)
oauthlint list                  List every shipped rule
oauthlint list --json           Same, as JSON
oauthlint init                  Generate .oauthlintrc.yml at cwd
oauthlint init --force          Overwrite an existing config
```

## Exit codes

| Code | When |
|------|------|
| 0 | No findings ≥ `failOn` threshold |
| 1 | At least one HIGH finding |
| 2 | At least one CRITICAL finding |
| 127 | Semgrep is not installed |

## Configuration

Create a `.oauthlintrc.yml` at your repo root with `oauthlint init`. The
file follows the schema in [`src/core/config.ts`](./src/core/config.ts).

```yaml
version: 1
include:
  - "src/**/*.{ts,tsx,js,jsx}"
exclude:
  - "**/*.test.ts"
rules:
  auth.cookie.no-samesite: warn
  auth.session.id-in-url: off
failOn: HIGH
```

## License

MIT — see [LICENSE](../../LICENSE).
