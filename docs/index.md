---
layout: home

hero:
  name: oauthlint
  text: Catch the auth bugs AI writes
  tagline: A free Semgrep linter for the OAuth, OIDC & JWT anti-patterns that AI coding tools ship — flagged before they merge.
  image:
    src: /logo.svg
    alt: oauthlint
  actions:
    - theme: brand
      text: Get started
      link: '#quick-start'
    - theme: alt
      text: Browse 30 rules
      link: /rules/
    - theme: alt
      text: View on GitHub
      link: https://github.com/Auspeo/oauthlint

features:
  - icon: 🤖
    title: Built for the AI era
    details: LLM assistants ship the same auth mistakes everywhere — alg&#58;none, hard-coded client secrets, tokens in localStorage, OAuth without state or PKCE. oauthlint flags them.
  - icon: 🎯
    title: 30 focused rules
    details: OAuth 2.0, OIDC, JWT, cookies, CORS and session hygiene — each mapped to CWE & OWASP, each with a page explaining the fix.
  - icon: ⚡
    title: Drops into any workflow
    details: One command to scan, a GitHub Action for CI, and a VS Code extension for inline diagnostics.
  - icon: 🔓
    title: Free & open source
    details: MIT licensed, powered by Semgrep. No account, no telemetry, no paywall.
---

## Quick start {#quick-start}

```bash
# scan a project — no install needed
npx oauthlint scan ./src

# fail CI on HIGH severity and above
npx oauthlint scan ./src --fail-on HIGH
```

Every finding links to a page that explains **why it matters** and **how to fix it**. Browse the full [rule catalogue](/rules/), or drop oauthlint into CI with the [GitHub Action](https://github.com/Auspeo/oauthlint#github-action).

> Requires [Semgrep](https://semgrep.dev) on the machine that runs the scan (`pipx install semgrep` or `brew install semgrep`).
