---
"oauthlint": minor
---

feat(cli): self-contained HTML report — `oauthlint scan --format html`

A shareable, printable audit artifact (inline CSS, no JS, no external requests): summary by
severity, findings grouped worst-first with rule id, file:line, message, code line, and a doc
link. All interpolated values are HTML-escaped (injection-tested).
