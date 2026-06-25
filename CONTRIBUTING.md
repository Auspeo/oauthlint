# Contributing to oauthlint

Thanks for helping make AI-written auth code safer. Whether you are reporting a
false positive, requesting a rule, or writing one, this guide gets you set up.

## Ways to contribute

- **Report a false positive or a miss.** A linter is only as good as its signal.
  If a rule fires on safe code, or skips something dangerous, open an issue with
  a minimal snippet. This is genuinely the most useful contribution.
- **Request a rule.** Seen an OAuth/OIDC/JWT anti-pattern AI tools keep writing?
  Open a *Rule request* issue.
- **Write a rule.** The whole pack is plain YAML plus test fixtures. See below.
- **Improve docs, the CLI, the Action, or the VS Code extension.**

## Project layout

```
rules/       oauthlint-rules — the Semgrep pack
  rules/<category>/*.yml        one file per rule
  tests/fixtures/<slug>/        vulnerable.ts + safe.ts per rule
  src/                          loader + schema
cli/         oauthlint — the CLI (scan, list, init, doctor)
action/      Docker-based GitHub Action wrapping the CLI
vscode/      VS Code extension
examples/    deliberately-vulnerable demo app used for dogfooding
site/        Astro docs site (oauthlint.dev); rule pages generated from the rule pack
docs/        static assets served by the docs site (logo, demo.gif, og image, CNAME)
scripts/     rule validation
```

## Local setup

You need **Node ≥ 20**, **pnpm 10** (via `corepack enable`), and **Semgrep**
(`pipx install semgrep` or `brew install semgrep`).

```bash
pnpm install
pnpm build
pnpm test:run     # rule pack + CLI + Action + VS Code + scripts
pnpm lint
pnpm typecheck
pnpm --filter oauthlint-site dev     # preview the docs site locally
```

## Adding a rule

A rule is one YAML file plus a pair of fixtures. The tests enforce the contract,
so if they pass, your rule is wired in.

**1. Write the rule** at `rules/rules/<category>/<name>.yml`:

```yaml
rules:
  - id: auth.<category>.<name>        # e.g. auth.jwt.alg-none
    languages: [javascript, typescript]
    severity: ERROR                   # ERROR | WARNING | INFO
    message: |
      What is wrong, why it is dangerous, and how to fix it.
      Reference the relevant RFC / OWASP item when you can.
    pattern-either:
      - pattern: '...'                # the dangerous shape(s)
    metadata:
      oauthlint-rule-id: AUTH-<CAT>-NNN
      oauthlint-doc-url: https://oauthlint.dev/rules/<slug>
      category: security
      cwe: CWE-###
      owasp: APIx:2023
      llm-prevalence: HIGH            # HIGH | MEDIUM | LOW
```

The **slug** is the id without the `auth.` prefix, dots turned into dashes:
`auth.jwt.alg-none` → `jwt-alg-none`.

**2. Add fixtures** at `rules/tests/fixtures/<slug>/`:

- `vulnerable.ts` — annotate every line the rule should flag with a
  `// ruleid: auth.<category>.<name>` comment on the line above it.
- `safe.ts` — correct code that must produce **zero** findings (this is how we
  keep false positives out).

```ts
// vulnerable.ts
// ruleid: auth.jwt.alg-none
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });
```

**3. Run the tests.** The fixture contract checks that `safe.ts` yields 0
findings and `vulnerable.ts` yields exactly one per `// ruleid:` annotation:

```bash
pnpm test:run
```

**4. Docs are automatic:** the docs site (`site/`) generates each rule's page
directly from the rule pack and fixtures at build time — there's nothing to
regenerate by hand. Preview locally with `pnpm --filter oauthlint-site dev`.

**5. Add a changeset:** `pnpm changeset` (pick a `patch` for a new rule), then
commit it with your change.

## Commits, hooks, and PRs

- **[Conventional Commits](https://www.conventionalcommits.org)** are enforced by
  a `commit-msg` hook: `feat: …`, `fix: …`, `docs: …`, `chore: …`.
- Git hooks (husky): `pre-commit` runs Biome on staged files; `pre-push` runs
  typecheck and the full test suite. In a real emergency, `--no-verify` bypasses
  them, but CI runs the same checks.
- Open a pull request against `main`. Fill in the template, keep it focused, and
  make sure CI is green. Releases are handled with
  [Changesets](https://github.com/changesets/changesets).

## Reporting security issues

Do not open a public issue for vulnerabilities in oauthlint itself. See
[SECURITY.md](SECURITY.md) and email **security@auspeo.com**.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By
participating you agree to uphold it.
