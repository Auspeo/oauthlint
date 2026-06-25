<div align="center">

# oauthlint

**Catch the OAuth / OIDC / JWT anti-patterns AI coding tools systematically produce.**

A curated, multi-language Semgrep rule pack · JS/TS · Python · Go · Java · Rust (and growing) · CLI + GitHub Action + VS Code · free & MIT

[![npm](https://img.shields.io/npm/v/oauthlint.svg)](https://www.npmjs.com/package/oauthlint)
[![npm downloads](https://img.shields.io/npm/dm/oauthlint.svg)](https://www.npmjs.com/package/oauthlint)
[![CI](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml/badge.svg)](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![docs](https://img.shields.io/badge/docs-oauthlint.dev-2f6feb.svg)](https://oauthlint.dev)

</div>

```bash
npx oauthlint scan ./src
```

> Requires [Semgrep](https://semgrep.dev/docs/getting-started/) on the machine running the scan (`pipx install semgrep` or `brew install semgrep`). The CLI invokes it under the hood and normalises the output for humans and CI.

📖 **Full documentation & rule catalogue → [oauthlint.dev](https://oauthlint.dev)**

---

## The problem

LLM coding assistants — Cursor, Claude, GitHub Copilot, Gemini — ship the *same*
OAuth/JWT mistakes across every project they touch:

- a JWT verified with `alg: none` accepted
- `client_secret` hard-coded in source
- an OAuth flow with no `state` and no PKCE
- a token written to `localStorage`, readable by any XSS
- `redirect_uri` allow-listed with a `*` wildcard
- a `/login` POST with no rate limiting
- a password persisted in plaintext
- `Math.random()` used for a CSRF token

oauthlint is the layer between generic SAST and an enterprise IAM program:
**free, focused, developer-first.** Every finding names the rule, the exact
`file:line`, *why* it's dangerous, and *how* to fix it — with CWE/OWASP mappings.

<div align="center">

![oauthlint scanning a project and flagging JWT auth issues](https://raw.githubusercontent.com/Auspeo/oauthlint/main/docs/public/demo.gif)

</div>

## Why oauthlint, and not just Semgrep?

Honest answer: nothing stops you from writing these rules yourself. Semgrep is
open source — it's the engine we run — and a capable engineer could reproduce a
lot of this. There's no technical moat and we won't pretend otherwise. What
oauthlint gives you is the work most people never do:

- **Low false positives, validated against real auth libraries.** The rules are
  run against `jose`, NextAuth, PyJWT, Authlib, `golang/oauth2`, `oauth2-rs`,
  Spring Security and more. Anything that fires on mature library source goes to
  a triage queue, not to you — validated across thousands of files of real
  auth-library source, with **zero false positives** on the clean libraries
  ([validation report](https://oauthlint.dev/VALIDATION)).
- **One coherent product across every language it covers.** Same concepts, same ID scheme,
  same docs — not a patchwork of community rules with mismatched styles.
- **Every finding teaches.** All 90 rules link to a fix page with CWE and OWASP
  mappings. It's a lesson, not a grep hit.
- **The angle the registry doesn't have:** oauthlint specifically targets the
  auth bugs AI coding tools ship on repeat, encoded in each rule's
  `llm-prevalence` metadata and measured by a [reproducible benchmark](https://github.com/Auspeo/oauthlint/tree/main/benchmark).

Use oauthlint when you'd rather not write and maintain an auth rule pack
yourself. That's the whole pitch.

## Quick start

```bash
# one-shot scan, no install
npx oauthlint scan ./src

# fail CI on HIGH severity and above
npx oauthlint scan ./src --fail-on HIGH

# machine-readable output
npx oauthlint scan ./src --json

# GitHub Code Scanning
npx oauthlint scan ./src --format sarif > oauthlint.sarif

# auto-apply safe fixes (e.g. cookie flags)
npx oauthlint scan ./src --fix
```

## Commands

```
oauthlint scan [path]           Scan a directory (default: current dir)
oauthlint scan --json           Emit machine-readable JSON
oauthlint scan --format sarif   Emit SARIF for GitHub Code Scanning
oauthlint scan --severity HIGH  Only show findings ≥ HIGH
oauthlint scan --fail-on off    Never fail the build (CI dry-run)
oauthlint scan --fix            Auto-apply safe fixes
oauthlint list                  List every shipped rule
oauthlint list --json           Same, as JSON
oauthlint init                  Generate .oauthlintrc.yml at cwd
oauthlint init --force          Overwrite an existing config
oauthlint doctor                Check your setup (Semgrep, config, …)
```

## Use it in CI

Run the CLI in a workflow and upload SARIF to **GitHub Code Scanning** so
findings appear inline on the PR:

```yaml
# .github/workflows/oauthlint.yml
jobs:
  oauthlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pipx install semgrep          # the engine oauthlint runs
      - run: npx oauthlint scan ./src --format sarif > oauthlint.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: oauthlint.sarif
```

Or just fail the build on HIGH findings: `npx oauthlint scan ./src --fail-on HIGH`.

> A dedicated **GitHub Action** and a **VS Code extension** (inline diagnostics +
> Quick Fix suppressions) are on the way — follow the [repo](https://github.com/Auspeo/oauthlint) for releases.

## What it catches

Rules across OAuth 2.0, OIDC, JWT, cookies, CORS, secrets and session hygiene —
each mapped to CWE & OWASP, each with a documentation page. Languages covered
today (more on the way):

| Language | Libraries |
|----------|-----------|
| JavaScript / TypeScript | jose, jsonwebtoken, NextAuth, express, … |
| Python | PyJWT, Authlib, requests, Flask, Django |
| Java | Spring Security, jjwt, nimbus-jose-jwt |
| Go | golang-jwt, crypto/tls, net/http |
| Rust | jsonwebtoken, reqwest, actix/tower |

👉 **Browse the full, always-current catalogue at [oauthlint.dev/rules](https://oauthlint.dev/rules/).**

## Configuration

Generate a `.oauthlintrc.yml` at your repo root with `oauthlint init`:

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

### Inline suppression

```ts
// oauthlint-disable-next-line auth.jwt.alg-none -- legacy code, replaced in Q2
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });
```

Wholesale silencing (`oauthlint-disable-file *`) is intentionally unsupported —
the next reviewer needs to see exactly which lines opted out, and why.

## Exit codes

| Code | When |
|:----:|------|
| `0` | No finding at or above the `--fail-on` threshold |
| `1` | At least one **HIGH** finding |
| `2` | At least one **CRITICAL** finding, or a scan whose output could not be parsed (it never silently exits clean) |
| `127` | Semgrep is not installed |

## License

MIT — see [LICENSE](https://github.com/Auspeo/oauthlint/blob/main/LICENSE).
Built and maintained by [Auspeo](https://github.com/Auspeo).
