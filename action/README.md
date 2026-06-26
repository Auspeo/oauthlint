# OAuthLint — GitHub Action

Catch the OAuth/OIDC/JWT anti-patterns AI coding tools systematically produce,
right inside your CI.

## Quick start

```yaml
name: OAuthLint
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Auspeo/oauthlint/action@v1
        with:
          severity: HIGH       # only emit HIGH+ findings
          fail-on: HIGH        # fail the job on HIGH+
```

## Inputs

| Name | Required | Default | Description |
|------|:-:|---------|-------------|
| `path` | no | `.` | Path to scan |
| `severity` | no | *(none)* | Filter floor: `INFO`/`LOW`/`MEDIUM`/`HIGH`/`CRITICAL` |
| `fail-on` | no | `HIGH` | Severity at which the job should fail. `off` = never fail. |
| `json` | no | `false` | When true, also write a JSON report |
| `output` | no | `oauthlint-report.json` | Path of the JSON report (when `json=true`) |
| `sarif` | no | `false` | When true, also write a SARIF 2.1.0 report for GitHub Code Scanning |
| `sarif-file` | no | `oauthlint.sarif` | Path of the SARIF report (when `sarif=true`) |

## Outputs

| Name | Description |
|------|-------------|
| `findings` | Number of findings (after filtering) |
| `highest-severity` | Highest severity in the run |
| `sarif-file` | Path to the generated SARIF report (only set when `sarif=true`) |

## Examples

### Block PRs on CRITICAL only, but still surface MEDIUM+ in logs

```yaml
- uses: Auspeo/oauthlint/action@v1
  with:
    severity: MEDIUM
    fail-on: CRITICAL
```

### Upload a JSON report as an artifact

```yaml
- uses: Auspeo/oauthlint/action@v1
  with:
    json: 'true'
    output: 'oauthlint.json'
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: oauthlint-report
    path: oauthlint.json
```

### Upload findings to GitHub Code Scanning (SARIF)

Enable `sarif: true`, then feed the `sarif-file` output to the official
`upload-sarif` action so findings show up in the **Security → Code scanning**
tab and as inline PR annotations.

```yaml
name: OAuthLint
on: [push, pull_request]

permissions:
  contents: read
  security-events: write   # required to upload SARIF

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: oauthlint
        uses: Auspeo/oauthlint/action@v1
        with:
          sarif: 'true'
          # SARIF is for surfacing findings, not for gating — let the upload
          # decide what to do. Use fail-on to gate the job independently.
          fail-on: 'off'

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: ${{ steps.oauthlint.outputs.sarif-file }}
```

## Marketplace listing

This Action is consumed via the monorepo path `Auspeo/oauthlint/action@v1` and works as-is. It is **not** on the GitHub Marketplace: GitHub only lists actions whose `action.yml` is at the repository root, and here it lives in `action/`. To list it later, split it into a dedicated `oauthlint-action` repo (or add a root `action.yml`). Tracked in [#23](https://github.com/Auspeo/oauthlint/issues/23).

## License

MIT — see [LICENSE](../../LICENSE).
