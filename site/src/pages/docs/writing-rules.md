---
layout: ../../layouts/DocsLayout.astro
title: "Writing rules"
description: "How to add an OAuthLint rule: the anatomy of a rule, the vulnerable/safe fixture pair, and the low-false-positive standard every rule is held to (validated against real-world code)."
section: "writing-rules"
---

# Writing rules

A rule is one YAML file plus a pair of test fixtures. There is no plugin API and no code to write: rules are plain [Semgrep](https://semgrep.dev) patterns, and the docs page you are reading right now was generated from the rule pack at build time.

The bar is not "can it catch the bug". The bar is **does it stay quiet on correct code**. OAuthLint exists because a noisy linter gets turned off, so a rule that fires on a safe pattern is a bug, not a feature.

## The standard: low false positives

This is the whole game. Before you write a pattern, decide what makes the dangerous shape *unambiguous*, and what nearby safe shape must never fire.

- **Be specific, not clever.** Match the exact API call and the exact argument that makes it dangerous. `NoOpPasswordEncoder.getInstance()` has one meaning; "a function that looks like it hashes a password" has a thousand.
- **Anchor to the library.** If a key like `ignoreExpiration: true` is only dangerous in a given framework, require the framework with a `pattern-inside` import guard so it cannot fire on an unrelated object that happens to share the key name.
- **Require co-occurrence when one signal is not enough.** A wildcard CORS origin is fine on its own; it is only dangerous *with* credentials. Match both on the same call, not either alone.
- **Carve out the safe form.** Use `pattern-not` to subtract the correct usage (a scoped path, a present allow-list, a real comparison), so the rule only survives on the genuinely wrong code.
- **Prefer pattern mode over taint.** Reach for `mode: taint` only when the bug is a real source-to-sink flow (SSRF, open redirect). Most anti-patterns are a single unambiguous shape, and pattern mode is far less prone to surprising matches.
- **Use closed allow-lists.** When matching "a weak algorithm", match against an explicit list of known-broken names. Modern, safe values then never match by construction.

If you cannot express the dangerous shape without also catching correct code, the rule is not ready. Hold it rather than ship noise.

## Anatomy of a rule

Create `rules/rules/<category>/<name>.yml`:

```yaml
rules:
  - id: auth.jwt.alg-none            # auth.<category>.<name> (kebab-case)
    languages: [javascript, typescript]
    severity: ERROR                  # ERROR | WARNING | INFO
    message: |
      A crisp first sentence stating what is wrong (it becomes the rule's
      title on this site).

      Then a short paragraph on why it is dangerous and how to fix it, with
      `inline code` for APIs and a reference to the relevant RFC or OWASP item.
    pattern-either:
      - pattern: jwt.verify($T, $K, { algorithms: [..., 'none', ...] })
    metadata:
      oauthlint-rule-id: AUTH-JWT-001   # unique, AUTH-<CAT>-NNN
      oauthlint-doc-url: https://oauthlint.dev/rules/jwt-alg-none
      category: security
      cwe: CWE-347                      # required
      owasp: API2:2023                  # optional
      llm-prevalence: HIGH              # HIGH | MEDIUM | LOW: how often AI tools emit it
      technology: [jsonwebtoken]        # optional
      references:                       # optional
        - https://datatracker.ietf.org/doc/html/rfc7519
```

The **slug** is the id without the `auth.` prefix, with dots turned into dashes: `auth.jwt.alg-none` becomes `jwt-alg-none`. That is also the doc URL and the fixture directory name. `llm-prevalence` is OAuthLint's signal: how often AI coding tools generate this anti-pattern by default.

## Fixtures prove the rule

Add a pair at `rules/tests/fixtures/<slug>/`:

- `vulnerable.<ext>`: the dangerous code, with a `// ruleid: <id>` comment on the line above every match the rule should report.
- `safe.<ext>`: the correct code, which must produce **zero** findings. This is where you encode "the rule does not fire on the right thing".

```ts
// vulnerable.ts
// ruleid: auth.jwt.alg-none
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });

// safe.ts
return jwt.verify(token, key, { algorithms: ['RS256'] });
```

The fixture contract is enforced by the test suite: `safe` must yield 0, and `vulnerable` must yield exactly one finding per `// ruleid:` annotation.

```bash
pnpm --filter oauthlint-rules test:run
```

## Validate against real code

Passing fixtures means the rule works on the cases you imagined. The harder question is whether it stays quiet on code you did not. OAuthLint validates the pack against a set of real public repositories (mature auth libraries and apps), checked out read-only:

```bash
pnpm validate
```

For a mature library (an `expectedSignal: low` target like `node-openid-client` or `next-auth`), a fire is a likely false positive and goes to a triage queue, not a "we caught a bug" column. **A new rule should fire zero times on the low-signal targets.** If it does fire, tighten the pattern until it does not, or document why the match is a true positive. Add the relevant reference repo to `scripts/validation-targets.yml` when your rule covers a framework that is not represented yet.

## Submit it

The docs site regenerates each rule's page from the pack automatically, so there is nothing to build by hand. Add a changeset and open a pull request:

```bash
pnpm changeset      # "oauthlint-rules", minor for a new rule
```

The full setup, project layout, and commit conventions live in [CONTRIBUTING.md](https://github.com/Auspeo/oauthlint/blob/main/CONTRIBUTING.md). Not sure a pattern is detectable at low false positives? Open a [rule request](https://github.com/Auspeo/oauthlint/issues/new/choose) with a snippet and we will figure it out together.
