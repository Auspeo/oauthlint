# OAuthLint — GitHub Action

Catch the OAuth/OIDC/JWT anti-patterns AI coding tools systematically produce,
right inside your CI.

Out of the box, every finding shows up **inline on the PR's _Files changed_ tab**
and in a **job summary** — no token, no extra permission, no SARIF upload required.

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
| `annotations` | no | `true` | Emit inline PR annotations + a Markdown job summary. Set to `false` to opt out. |

## Outputs

| Name | Description |
|------|-------------|
| `findings` | Number of findings (after filtering) |
| `highest-severity` | Highest severity in the run |
| `sarif-file` | Path to the generated SARIF report (only set when `sarif=true`) |

## Inline PR annotations & job summary

By default (`annotations: true`) the Action surfaces findings in two places, using
only [GitHub workflow commands](https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions)
and the [job summary](https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary)
— **neither needs a token or any extra permission**, and they're additive to the
SARIF / JSON / `fail-on` behaviour.

**Inline annotations.** Each finding becomes a workflow-command annotation so it
renders inline on the PR's _Files changed_ tab and in the check's summary:

- `HIGH` / `CRITICAL` → `::error file=<path>,line=<line>,title=<ruleId>::<message>`
- `MEDIUM` and below → `::warning …`

Paths are normalized to be **repo-relative** (the `/github/workspace` prefix is
stripped) so GitHub anchors them to the diff, and messages are kept single-line
(newlines are escaped as `%0A`). A `col=` property is included when the report
carries a column.

**Job summary.** A Markdown report is appended to `$GITHUB_STEP_SUMMARY` with a
heading, a count by severity, and a table of findings
(`severity · rule · file:line · message`). Each rule links to its
`oauthlint.dev/rules/<slug>` doc where derivable. The table is capped at a
reasonable size with a `…and N more` note rather than silently truncating.

> Annotations live on the **check run / PR**, complementary to SARIF (which lives
> in the **Security → Code scanning** tab). Use SARIF when you also want the
> findings tracked there; use annotations for a zero-config inline review.

### Opt out of annotations

```yaml
- uses: Auspeo/oauthlint/action@v1
  with:
    annotations: 'false'   # no inline annotations, no job summary
```

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
