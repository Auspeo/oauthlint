# vibe-app-express — DELIBERATELY VULNERABLE

This Express app is a **DEMONSTRATION TARGET** for OAuthLint.

It contains a hand-curated collection of OAuth/OIDC/JWT anti-patterns
that AI coding tools (Cursor, Claude Code, Copilot, Gemini Code Assist)
systematically produce when asked to add authentication.

**DO NOT** copy this code. **DO NOT** deploy this code. It exists only
so that `oauthlint scan ./examples/vibe-app-express` produces a rich,
illustrative report.

To run OAuthLint against it:

```bash
npx oauthlint scan ./examples/vibe-app-express
```

Expected output: ≥ 8 findings spread across the Wave-1 rule pack.
