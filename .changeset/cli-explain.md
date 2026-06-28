---
"oauthlint": minor
---

feat(cli): `oauthlint explain <rule>` — the rule docs in your terminal

Resolves a rule by id, slug, or AUTH-id and prints its severity, CWE/OWASP, LLM-prevalence,
the why + fix, and the vulnerable/safe examples — offline, from the bundled pack. `--json` for
the structured object. Pretty scan output now hints `oauthlint explain <rule-id>` per finding.
