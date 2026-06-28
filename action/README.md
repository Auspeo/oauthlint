# OAuthLint GitHub Action

Catch the OAuth/OIDC/JWT anti-patterns AI coding tools systematically produce,
right inside your CI.

Out of the box, every finding shows up **inline on the PR's _Files changed_ tab**
and in a **job summary**, with no token, no extra permission, and no SARIF upload required.

## Quick start

```yaml
name: OAuthLint
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Auspeo/oauthlint@v1
        with:
          severity: HIGH       # only emit HIGH+ findings
          fail-on: HIGH        # fail the job on HIGH+
```

> **Which `uses:` line?** `Auspeo/oauthlint@v1` (repo root) is the
> Marketplace-listed entrypoint and the recommended one. The original
> `Auspeo/oauthlint/action@v1` (subpath) still works and is fully supported.
> The root action is a thin composite that delegates to it, so behaviour is
> identical. Use whichever you already have pinned.

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
| `html` | no | `false` | When true, also write a self-contained HTML audit report you can share or upload as an artifact |
| `html-file` | no | `oauthlint-report.html` | Path of the HTML report (when `html=true`) |
| `annotations` | no | `true` | Emit inline PR annotations + a Markdown job summary. Set to `false` to opt out. |

## Outputs

| Name | Description |
|------|-------------|
| `findings` | Number of findings (after filtering) |
| `highest-severity` | Highest severity in the run |
| `sarif-file` | Path to the generated SARIF report (only set when `sarif=true`) |
| `html-file` | Path to the generated HTML report (only set when `html=true`) |

## Inline PR annotations & job summary

By default (`annotations: true`) the Action surfaces findings in two places, using
only [GitHub workflow commands](https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions)
and the [job summary](https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary).
**Neither needs a token or any extra permission**, and they're additive to the
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

### Produce a shareable HTML audit report

Enable `html: true` to write a self-contained HTML report (the `--format html`
output of the CLI), then upload it as an artifact so anyone can download a single
file and open it in a browser, no SARIF tab or token required. Like SARIF, the
HTML pass runs with `--fail-on off` and can never fail the job; use `fail-on` to
gate the build independently.

```yaml
name: OAuthLint
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: oauthlint
        uses: Auspeo/oauthlint/action@v1
        with:
          html: 'true'
          html-file: 'oauthlint-report.html'

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: oauthlint-html-report
          path: ${{ steps.oauthlint.outputs.html-file }}
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
          # SARIF is for surfacing findings, not for gating. Let the upload
          # decide what to do. Use fail-on to gate the job independently.
          fail-on: 'off'

      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: ${{ steps.oauthlint.outputs.sarif-file }}
```

## Marketplace listing

GitHub only lists actions whose `action.yml` is at the **repository root**, but the real logic of this Action lives here in `action/`. To make it listable without breaking existing `Auspeo/oauthlint/action@v1` users, the repo root carries a thin **composite** [`action.yml`](../action.yml) whose single step is `uses: ./action`. It delegates to this Docker action, mirroring every input/default/output. So:

- `Auspeo/oauthlint@v1`: the Marketplace-facing entrypoint (root composite).
- `Auspeo/oauthlint/action@v1`: the Docker action directly (unchanged, still supported).

Both run identical logic; the composite just forwards inputs and re-exposes outputs.

> **One-time manual step to actually list it.** Publishing to the Marketplace is not done from code: on a tagged GitHub **Release**, tick the **“Publish this Action to the GitHub Marketplace”** checkbox (you must accept the Developer Agreement and the repo must be public with the root `action.yml` present). After that, the moving `v1` tag (see [`major-tag.yml`](../.github/workflows/major-tag.yml)) keeps the listing current on each release.

## License

MIT. See [LICENSE](../LICENSE).
