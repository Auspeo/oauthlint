---
layout: ../../layouts/DocsLayout.astro
title: "Use with Semgrep"
description: "Run the full OAuthLint pack with one Semgrep command and no install — semgrep --config https://oauthlint.dev/r/oauthlint.yaml ./src — plus per-language bundles."
section: "semgrep"
---

# Use with Semgrep

OAuthLint ships as plain Semgrep rules. If you already have [Semgrep](https://semgrep.dev) installed, you can run the **entire pack** against your code with a single command. No install, no config file, no account:

```bash
semgrep --config https://oauthlint.dev/r/oauthlint.yaml ./src
```

That URL serves the complete OAuthLint ruleset: every OAuth / OIDC / JWT / session / CORS / TLS anti-pattern we detect, merged into one Semgrep config. Point it at any path (`./src`, `.`, a single file) and Semgrep does the rest.

> Don't have Semgrep? `pip install semgrep` (or `brew install semgrep`). Prefer zero dependencies? Use the [`oauthlint` CLI](/docs/cli): `npx oauthlint scan ./src` bundles a pinned rule pack and manages Semgrep for you.

## Per-language bundles

If you only care about one language, use the matching subset so Semgrep loads fewer rules:

| Language | Config URL |
| --- | --- |
| JavaScript | `https://oauthlint.dev/r/oauthlint-javascript.yaml` |
| TypeScript | `https://oauthlint.dev/r/oauthlint-typescript.yaml` |
| Python | `https://oauthlint.dev/r/oauthlint-python.yaml` |
| Go | `https://oauthlint.dev/r/oauthlint-go.yaml` |
| Java | `https://oauthlint.dev/r/oauthlint-java.yaml` |
| Rust | `https://oauthlint.dev/r/oauthlint-rust.yaml` |

```bash
# Python-only example
semgrep --config https://oauthlint.dev/r/oauthlint-python.yaml ./app
```

The combined `oauthlint.yaml` already contains every rule across all languages. Semgrep automatically skips rules whose languages don't match the files it scans, so the combined config is a safe default for polyglot repos.

## Findings link back to the docs

Every rule carries its full metadata (the `oauthlint-doc-url`, `cwe`, and `owasp` tags), so each finding tells you exactly what's wrong and where to read more. Browse the catalogue at [oauthlint.dev/rules](/rules), or open the `oauthlint-doc-url` printed alongside any finding.

## Always the latest pack

The hosted configs are **regenerated from the current rule pack on every site build**, so `https://oauthlint.dev/r/oauthlint.yaml` always reflects the latest rules. That's ideal for staying current, but it means the ruleset can change without warning.

If you need a **pinned, reproducible** ruleset (recommended for CI gates), don't fetch the URL. Vendor a specific version instead:

- Use the [`oauthlint` CLI](/docs/cli): `npx oauthlint@<version> scan ./src`, which bundles a fixed rule pack.
- Or install the rules package from npm, [`oauthlint-rules`](https://www.npmjs.com/package/oauthlint-rules), and point Semgrep at the vendored YAML.

## Use it in CI

The one-liner drops straight into any pipeline that has Semgrep available:

```yaml
# .github/workflows/oauthlint.yml
name: oauthlint
on: [push, pull_request]
jobs:
  semgrep:
    runs-on: ubuntu-latest
    container: semgrep/semgrep
    steps:
      - uses: actions/checkout@v4
      - run: semgrep --config https://oauthlint.dev/r/oauthlint.yaml --error .
```

For a turnkey CI integration with SARIF upload and severity gating, see the [GitHub Action](/docs/github-action) instead.
