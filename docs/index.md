---
layout: home

hero:
  name: oauthlint
  text: Catch the auth bugs AI writes
  tagline: A free Semgrep linter for the OAuth, OIDC & JWT anti-patterns that AI coding tools ship — flagged before they merge.
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
  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>'
    title: Built for the AI era
    details: LLM assistants ship the same auth mistakes everywhere — alg&#58;none, hard-coded client secrets, tokens in localStorage, OAuth without state or PKCE. oauthlint flags them.
  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>'
    title: 30 focused rules
    details: OAuth 2.0, OIDC, JWT, cookies, CORS and session hygiene — each mapped to CWE & OWASP, each with a page explaining the fix.
  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>'
    title: Drops into any workflow
    details: One command to scan, a GitHub Action for CI, and a VS Code extension for inline diagnostics.
  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>'
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
