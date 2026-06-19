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
      - uses: OAuthLint/oauthlint-action@v1
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

## Outputs

| Name | Description |
|------|-------------|
| `findings` | Number of findings (after filtering) |
| `highest-severity` | Highest severity in the run |

## Examples

### Block PRs on CRITICAL only, but still surface MEDIUM+ in logs

```yaml
- uses: OAuthLint/oauthlint-action@v1
  with:
    severity: MEDIUM
    fail-on: CRITICAL
```

### Upload a JSON report as an artifact

```yaml
- uses: OAuthLint/oauthlint-action@v1
  with:
    json: 'true'
    output: 'oauthlint.json'
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: oauthlint-report
    path: oauthlint.json
```

## License

MIT — see [LICENSE](../../LICENSE).
