<div align="center">

<img src="docs/public/logo.svg" width="76" alt="oauthlint logo" />

# oauthlint

**Catch the OAuth / OIDC / JWT anti-patterns AI coding tools systematically produce.**

90 Semgrep rules (JS/TS · Python · Go · Java · Rust) · CLI + GitHub Action + VS Code extension · free & MIT licensed

[![CI](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml/badge.svg)](https://github.com/Auspeo/oauthlint/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/oauthlint.svg)](https://www.npmjs.com/package/oauthlint)
[![npm downloads](https://img.shields.io/npm/dm/oauthlint.svg)](https://www.npmjs.com/package/oauthlint)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![docs](https://img.shields.io/badge/docs-oauthlint.dev-2f6feb.svg)](https://oauthlint.dev)
[![powered by Semgrep](https://img.shields.io/badge/powered%20by-Semgrep-0a7d6b.svg)](https://semgrep.dev)

</div>

```bash
npx oauthlint scan ./src
```

> Requires [Semgrep](https://semgrep.dev) on the machine running the scan (`pipx install semgrep` or `brew install semgrep`).

📖 **Full documentation & rule catalogue: [oauthlint.dev](https://oauthlint.dev)**

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
- …and 22 more

oauthlint is the missing layer between generic SAST (Snyk, Semgrep) and enterprise IAM ($50K+/year): **free, focused, developer-first.** Every finding links to a page explaining *why it matters* and *how to fix it*.

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

# auto-apply safe fixes (e.g. cookie flags)
npx oauthlint scan ./src --fix
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

### VS Code extension

Install **oauthlint** from the Marketplace for inline diagnostics as you type, plus Quick Fix suppressions.

### Inline suppression

```ts
// oauthlint-disable-next-line auth.jwt.alg-none -- legacy code, replaced in Q2
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });
```

Wholesale silencing (`oauthlint-disable-file *`) is intentionally unsupported — the next reviewer needs to see exactly which lines opted out.

## Rules

90 rules across OAuth 2.0, OIDC, JWT, cookies, CORS and session hygiene (42 JavaScript/TypeScript + 12 Python + 12 Go + 12 Java + 12 Rust) — each mapped to CWE & OWASP, each with a documentation page.

👉 **Browse the full catalogue at [oauthlint.dev/rules](https://oauthlint.dev/rules/).**

## Language support

oauthlint is built on [Semgrep](https://semgrep.dev), whose engine is **language-agnostic**. The rules are plain YAML data, so adding a language is a matter of **writing rule packs** — not re-architecting anything.

| Language | Status |
|----------|:------:|
| JavaScript / TypeScript | ✅ shipping (42 rules) |
| Python (PyJWT, requests, Flask, Django) | ✅ shipping (12 rules) |
| Java (Spring Security, jjwt, nimbus-jose-jwt) | ✅ shipping (12 rules) |
| Go (golang-jwt, crypto/tls, net/http) | ✅ shipping (12 rules) |
| Rust (jsonwebtoken, reqwest, actix/tower) | ✅ shipping (12 rules) |

**Why JS/TS first?** That's where AI coding tools generate the most code — and therefore the most OAuth/JWT bugs. It's the highest-density beachhead, not the ceiling. Want your stack covered? [Open an issue](https://github.com/Auspeo/oauthlint/issues).

## What's in this repo

| Package | What it does |
|---------|--------------|
| [`rules/`](rules) | 90 Semgrep rules (JS/TS · Python · Go · Java · Rust), schema-validated, with vulnerable + safe fixtures |
| [`cli/`](cli) | `scan`, `list`, `init`, `doctor` — pretty + JSON + SARIF output |
| [`action/`](action) | Docker-based GitHub Action wrapping the CLI |
| [`vscode/`](vscode) | VS Code extension: diagnostics + Quick Fix suppressions |
| [`examples/`](examples) | Deliberately-vulnerable demo apps used for dogfooding |

## Develop

```bash
pnpm install
pnpm test:run     # full suite: rule pack + CLI + Action + VS Code + scripts
pnpm lint
pnpm build
pnpm typecheck
pnpm docs:dev     # preview the docs site locally
```

**Adding a rule:** drop a YAML file in `rules/rules/<category>/`, add `vulnerable.ts` + `safe.ts` fixtures, and the schema-driven tests pick it up automatically. Run `pnpm docs:rules` to refresh the generated docs.

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

MIT — see [LICENSE](LICENSE). Built by [Maurice Anney](https://github.com/Mauriceanney), an IAM engineer.
