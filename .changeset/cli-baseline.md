---
"oauthlint": minor
---

feat(cli): baseline support — adopt on existing codebases, alert only on new findings

`oauthlint baseline` writes a `.oauthlint-baseline.json` of current findings (stable,
line-shift-resilient fingerprints), and `oauthlint scan --baseline` reports only findings
not in the baseline (exit code gates on new findings only).
