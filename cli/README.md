<div align="center">

# oauthlint

**Catch the OAuth / OIDC / JWT / session / CORS anti-patterns AI coding tools systematically produce.**

A curated, multi-language Semgrep rule pack · JS/TS · Python · Go · Rust · Java · CLI + GitHub Action + VS Code · free & MIT

[![npm](https://img.shields.io/npm/v/oauthlint.svg?style=flat-square)](https://www.npmjs.com/package/oauthlint)
[![npm downloads](https://img.shields.io/npm/dm/oauthlint.svg?style=flat-square)](https://www.npmjs.com/package/oauthlint)
[![CI](https://img.shields.io/github/actions/workflow/status/Auspeo/oauthlint/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![docs](https://img.shields.io/badge/docs-oauthlint.dev-2f6feb.svg?style=flat-square)](https://oauthlint.dev)
[![powered by Semgrep](https://img.shields.io/badge/powered%20by-Semgrep-0a7d6b.svg?style=flat-square)](https://semgrep.dev)

</div>

```bash
npx oauthlint scan ./src
```

> Requires [Semgrep](https://semgrep.dev/docs/getting-started/) on the machine running the scan (`pipx install semgrep` or `brew install semgrep`). The CLI invokes it under the hood and normalises the output for humans and CI.

📖 **Full docs & rule catalogue → [oauthlint.dev/docs](https://oauthlint.dev/docs)** · 🔬 **the research behind it → [oauthlint.dev/research](https://oauthlint.dev/research)**

---

## Quick start

```bash
# one-shot scan, no install
npx oauthlint scan ./src

# fail CI on HIGH severity and above
npx oauthlint scan ./src --fail-on HIGH

# GitHub Code Scanning (SARIF) or a shareable HTML audit report
npx oauthlint scan ./src --format sarif > oauthlint.sarif
npx oauthlint scan ./src --format html  > report.html

# preview safe autofixes as a diff, then apply them
npx oauthlint scan ./src --fix-dry-run
npx oauthlint scan ./src --fix

# learn a rule in the terminal: the why, the fix, and vulnerable/safe examples
npx oauthlint explain auth.jwt.alg-none
```

Scan only what changed for fast pre-commit hooks and editors with `--diff` / `--staged`, or adopt on a large repo with a [baseline](https://oauthlint.dev/docs/cli#baseline) (`oauthlint baseline ./src` then `scan --baseline`) so you're alerted on **new** findings only. Other commands: `list`, `explain`, `init`, `doctor`. Run `oauthlint --help` or see the [full CLI reference](https://oauthlint.dev/docs/cli).

### Every finding teaches

Each finding ends with a hint, `↳ run \`oauthlint explain <rule-id>\` for details + the fix`. `oauthlint explain` brings the rule docs into your terminal, offline, from the bundled pack: severity, CWE/OWASP with canonical links, `llm-prevalence`, the why + how-to-fix, and side-by-side **vulnerable** vs **safe** code. It resolves a rule by id (`auth.jwt.alg-none`), slug (`jwt-alg-none`), or oauthlint-rule-id (`AUTH-JWT-001`); add `--json` for the structured rule object.

## What it catches

AI coding assistants (tools like GitHub Copilot, Cursor, and Claude Code, and others) ship the *same* auth bugs across every project: a JWT accepted with `alg: none`, a hard-coded `client_secret`, an OAuth flow with no `state`/PKCE, a token in `localStorage`, a `*` wildcard `redirect_uri`, an unrate-limited `/login`, a plaintext password, `Math.random()` for a CSRF token.

- **138 rules** across **JavaScript/TypeScript, Python, Go, Rust, and Java**, each mapped to CWE/OWASP with a fix page (a lesson, not a grep hit).
- **Dataflow (taint) analysis.** Beyond pattern-matching, the pack traces untrusted input through to dangerous sinks: an OAuth credential reaching a log sink, request input reaching a JWT verification key, **open-redirect** and **SSRF**.
- **Autofix.** `--fix` applies safe rewrites (cookie flags and similar) in place; `--fix-dry-run` previews them as a unified diff first. Per-finding fix data also rides along in `--json` and SARIF under `fixes`.
- **HTML report.** `scan --format html` renders a self-contained, offline, no-JavaScript audit you can email or attach to a PR.
- Plus **SARIF** for Code Scanning, incremental `--diff`/`--staged`, and a [baseline](https://oauthlint.dev/docs/cli#baseline) for existing codebases.

👉 **Browse the always-current catalogue at [oauthlint.dev/rules](https://oauthlint.dev/rules/).**

## Use directly with Semgrep, no install

Already have [Semgrep](https://semgrep.dev)? Run the full pack with one command, no config file:

```bash
semgrep --config https://oauthlint.dev/r/oauthlint.yaml ./src
```

Per-language bundles exist too (`oauthlint-python.yaml`, `oauthlint-go.yaml`, …). That URL is always the latest pack; for a pinned ruleset in CI, use this CLI (`npx oauthlint@<version> scan`) or vendor [`oauthlint-rules`](https://www.npmjs.com/package/oauthlint-rules). See [the Semgrep docs](https://oauthlint.dev/docs/semgrep).

## Why oauthlint, and not just Semgrep?

Honest answer: nothing stops you writing these rules yourself. Semgrep is open source and it's the engine we run, so there's no technical moat. What oauthlint gives you is the work most people never do:

- **Low false positives, validated against real auth libraries.** `jose`, NextAuth, PyJWT, Authlib, `golang/oauth2`, `oauth2-rs`, Spring Security and more. Anything that fires on mature library source goes to a triage queue, not to you ([validation report](https://oauthlint.dev/validation)).
- **One coherent product across every language.** Same concepts, same ID scheme, same docs, not a patchwork of community rules.
- **The angle the registry doesn't have.** It targets the auth bugs AI tools ship on repeat, encoded in each rule's `llm-prevalence` metadata and measured by a reproducible benchmark ([the research](https://oauthlint.dev/research)).

Use oauthlint when you'd rather not write and maintain an auth rule pack yourself. That's the whole pitch.

## Also available

- **GitHub Action.** `Auspeo/oauthlint@v1` (the `Auspeo/oauthlint/action@v1` subpath still works), Docker-based (any language), with inline PR annotations and a job summary. [Docs](https://github.com/Auspeo/oauthlint/tree/main/action).
- **CI recipes.** SARIF uploads to [GitHub Code Scanning](https://oauthlint.dev/docs/code-scanning), and there's a worked example for [GitLab CI](https://oauthlint.dev/docs/gitlab-ci).
- **VS Code / Cursor / Windsurf.** [oauthlint](https://marketplace.visualstudio.com/items?itemName=auspeo.oauthlint-vscode) on the VS Code Marketplace and [OpenVSX](https://open-vsx.org/extension/auspeo/oauthlint-vscode): inline diagnostics on save, a status-bar finding count, an "Apply fix" Quick Fix where a rule ships a safe autofix, and Quick Fix suppressions.

## License

MIT. See [LICENSE](https://github.com/Auspeo/oauthlint/blob/main/LICENSE). Built and maintained by [Auspeo](https://github.com/Auspeo).
