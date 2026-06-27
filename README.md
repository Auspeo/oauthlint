<div align="center">

<a href="https://oauthlint.dev"><img src="docs/public/banner.png" alt="OAuthLint — AI ships the auth bug. Catch it before the PR." width="840" /></a>

**Catch the OAuth / OIDC / JWT / session / CORS anti-patterns AI coding tools systematically produce.**

A curated, multi-language Semgrep rule pack with **dataflow (taint) analysis** (JS/TS · Python · Go · Java · Rust, and growing) · CLI + GitHub Action + VS Code extension · free & MIT licensed

[![CI](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml/badge.svg)](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/oauthlint.svg)](https://www.npmjs.com/package/oauthlint)
[![npm downloads](https://img.shields.io/npm/dm/oauthlint.svg)](https://www.npmjs.com/package/oauthlint)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/auspeo.oauthlint-vscode?label=VS%20Code&color=2f6feb)](https://marketplace.visualstudio.com/items?itemName=auspeo.oauthlint-vscode)
[![docs](https://img.shields.io/badge/docs-oauthlint.dev-2f6feb.svg)](https://oauthlint.dev)
[![powered by Semgrep](https://img.shields.io/badge/powered%20by-Semgrep-0a7d6b.svg)](https://semgrep.dev)

</div>

```bash
npx oauthlint scan ./src
```

> Requires [Semgrep](https://semgrep.dev) on the machine running the scan (`pipx install semgrep` or `brew install semgrep`).

📖 **Full documentation & rule catalogue: [oauthlint.dev](https://oauthlint.dev)** · 🔬 **the empirical case for it: [oauthlint.dev/research](https://oauthlint.dev/research)**

---

## What it is

LLM coding assistants (Cursor, Claude Code, GitHub Copilot, Gemini Code Assist) ship the same OAuth/JWT bugs across every project they touch:

- JWT verified with `alg: none` accepted
- `client_secret` hard-coded in source
- `redirect_uri` whitelisted with `*` wildcards
- token written to `localStorage` (XSS-readable)
- OAuth flow without `state` / without PKCE
- `/login` POST without rate limiting
- password persisted in plaintext
- `Math.random()` used for CSRF tokens
- untrusted input flowing into a redirect or an outbound request (**open-redirect / SSRF**), caught by **dataflow (taint) analysis** — not just pattern-matching
- …and 100+ more, across JS/TS · Python · Go · Java · Rust

oauthlint is the missing layer between generic SAST (Snyk, Semgrep) and enterprise IAM ($50K+/year): **free, focused, developer-first.** Every finding links to a page explaining *why it matters* and *how to fix it*.

## Why OAuthLint and not just Semgrep?

Honest answer: nothing stops you from writing these rules yourself. Semgrep is open source, it's the engine we run, and a capable engineer could reproduce a lot of this. We don't have a technical moat, and we won't pretend otherwise.

What we have is the work most people never do:

- **Low false positives, validated against real auth libraries.** We run the rules against `jose`, NextAuth, PyJWT, Authlib, `golang/oauth2`, `oauth2-rs`, Spring and more — and anything that fires on mature library source goes to a triage queue, not to you. Tuning a rule so it doesn't trip on `jose`'s internals is the invisible, tedious work the generic Semgrep registry skips. (See the [validation report](https://oauthlint.dev/VALIDATION): validated across thousands of files of real auth-library source, with zero false positives on the clean auth libraries.)
- **One coherent product across every language it covers.** Same concept, same ID scheme, same docs — `AUTH-JWT-001` in JS maps to `AUTH-GO-JWT-001` in Go. Not a patchwork of community rules with mismatched styles.
- **Every finding teaches.** Every rule links to a fix page with CWE and OWASP mappings. It's a lesson, not a grep hit.
- **Dataflow, not just patterns.** Taint-mode rules trace untrusted input through to dangerous sinks (open-redirect, SSRF), catching bugs a single-line pattern would miss.
- **The angle the registry doesn't have:** OAuthLint targets the OAuth/JWT bugs AI coding tools ship on repeat — encoded in each rule's `llm-prevalence` metadata and measured by the empirical [/research](https://oauthlint.dev/research) report.

Use OAuthLint when you'd rather not write and maintain an auth rule pack yourself. That's the whole pitch.

## What it looks like

![oauthlint scanning a project and flagging JWT auth issues](docs/public/demo.gif)

Every finding names the rule, the exact file and line, why it is dangerous, and
a link to the fix.

## Quick start

### CLI

```bash
# one-shot scan, no install
npx oauthlint scan ./src

# fail CI on HIGH severity and above
npx oauthlint scan ./src --fail-on HIGH

# machine-readable output
npx oauthlint scan ./src --json

# GitHub Code Scanning
npx oauthlint scan ./src --format sarif > oauthlint.sarif

# a shareable, self-contained HTML audit report
npx oauthlint scan ./src --format html > report.html

# auto-apply safe fixes (e.g. cookie flags)
npx oauthlint scan ./src --fix

# incremental: scan only what changed (fast; great for pre-commit hooks)
npx oauthlint scan --diff       # vs the default branch
npx oauthlint scan --staged     # only git-staged files

# adopt on an existing codebase: snapshot today's findings, then alert on NEW ones only
npx oauthlint baseline ./src
npx oauthlint scan ./src --baseline --fail-on HIGH
```

Other commands: `oauthlint list` (browse rules), `oauthlint init` (write a config), `oauthlint doctor` (check your setup).

### GitHub Action

```yaml
- uses: Auspeo/oauthlint/action@v1
  with:
    severity: HIGH
    fail-on: HIGH
```

The Action is **Docker-based**, so it runs in any repository's CI regardless of the project's language.

### VS Code / Cursor / Windsurf

Install **[oauthlint](https://marketplace.visualstudio.com/items?itemName=auspeo.oauthlint-vscode)** from the VS Code Marketplace (or [OpenVSX](https://open-vsx.org/extension/auspeo/oauthlint-vscode) for Cursor / Windsurf) for inline diagnostics on save, a status-bar finding count, plus Quick Fix suppressions.

### Use directly with Semgrep

Already have [Semgrep](https://semgrep.dev)? Run the **full pack** with one command — no install, no config file:

```bash
semgrep --config https://oauthlint.dev/r/oauthlint.yaml ./src
```

Per-language bundles are available too (e.g. `oauthlint-python.yaml`, `oauthlint-go.yaml`). The hosted config is always the latest pack; for a pinned ruleset, use the `oauthlint` CLI / [`oauthlint-rules`](https://www.npmjs.com/package/oauthlint-rules) on npm. See [the Semgrep docs](https://oauthlint.dev/docs/semgrep).

### Inline suppression

```ts
// oauthlint-disable-next-line auth.jwt.alg-none -- legacy code, replaced in Q2
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });
```

Wholesale silencing (`oauthlint-disable-file *`) is intentionally unsupported — the next reviewer needs to see exactly which lines opted out.

## Rules

**100+ rules** across OAuth 2.0, OIDC, JWT, cookies, CORS, secrets and session hygiene, in JavaScript/TypeScript, Python, Go, Java and Rust — each mapped to CWE & OWASP, each with a documentation page. Some are **taint-mode dataflow rules** (open-redirect, SSRF) that follow untrusted input to its sink rather than matching a single line. The catalogue grows with every release.

👉 **Browse the full catalogue at [oauthlint.dev/rules](https://oauthlint.dev/rules/).**

## Language support

oauthlint is built on [Semgrep](https://semgrep.dev), whose engine is **language-agnostic**. The rules are plain YAML data, so adding a language is a matter of **writing rule packs** — not re-architecting anything.

| Language | Status |
|----------|:------:|
| JavaScript / TypeScript | ✅ shipping |
| Python (PyJWT, requests, Flask, Django) | ✅ shipping |
| Java (Spring Security, jjwt, nimbus-jose-jwt) | ✅ shipping |
| Go (golang-jwt, crypto/tls, net/http) | ✅ shipping |
| Rust (jsonwebtoken, reqwest, actix/tower) | ✅ shipping |
| More (open an issue to request your stack) | 🔜 planned |

**Why JS/TS first?** That's where AI coding tools generate the most code — and therefore the most OAuth/JWT bugs. It's the highest-density beachhead, not the ceiling. Want your stack covered? [Open an issue](https://github.com/Auspeo/oauthlint/issues).

## What's in this repo

| Package | What it does |
|---------|--------------|
| [`rules/`](rules) | Semgrep rules (JS/TS · Python · Go · Java · Rust), schema-validated, with vulnerable + safe fixtures |
| [`cli/`](cli) | `scan` (incremental `--diff` / `--staged`), `baseline`, `list`, `init`, `doctor` — pretty + JSON + SARIF + HTML output |
| [`action/`](action) | Docker-based GitHub Action wrapping the CLI, with inline PR annotations + job summary |
| [`vscode/`](vscode) | VS Code / Cursor / Windsurf extension (Marketplace + OpenVSX): diagnostics, status bar + Quick Fix suppressions |
| [`examples/`](examples) | Deliberately-vulnerable demo apps used for dogfooding |

## Develop

```bash
pnpm install
pnpm test:run     # full suite: rule pack + CLI + Action + VS Code + scripts
pnpm lint
pnpm build
pnpm typecheck
pnpm --filter oauthlint-site dev     # preview the docs site locally
```

**Adding a rule:** drop a YAML file in `rules/rules/<category>/`, add `vulnerable.ts` + `safe.ts` fixtures, and the schema-driven tests pick it up automatically. The docs site (`site/`) generates its rule pages straight from the rule pack, so no separate docs-refresh step is needed.

### Commits & releases

- **[Conventional Commits](https://www.conventionalcommits.org)** are enforced (`feat:`, `fix:`, `docs:`, `chore:`, …) via a `commit-msg` hook.
- **Git hooks** (husky): `pre-commit` runs Biome on staged files; `pre-push` runs typecheck + the full test suite.
- **Releases** use [Changesets](https://github.com/changesets/changesets) — see [RELEASE.md](RELEASE.md).

## Contributing

The most useful contribution is telling us when a rule is wrong: open a
[false-positive issue](https://github.com/Auspeo/oauthlint/issues/new/choose).
Want a new anti-pattern caught, or want to write the rule yourself? See
**[CONTRIBUTING.md](CONTRIBUTING.md)** — a rule is one YAML file plus a
`vulnerable.ts` / `safe.ts` fixture pair. By participating you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE). Built and maintained by [Auspeo](https://github.com/Auspeo).
