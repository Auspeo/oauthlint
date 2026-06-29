---
"oauthlint": minor
---

Surface per-finding autofix data in the machine-readable report.

When a matched rule ships a `fix:`, the finding now carries an optional `fix`
object with the rendered replacement text and the exact span it overwrites
(1-based line/column plus 0-based byte offsets). This is exposed in two places:

- `--json` adds the optional `fix` field to each finding (omitted when there is
  no fix, so existing consumers are byte-compatible).
- `--format sarif` populates the standard SARIF 2.1.0 `fixes` array on the
  result (`artifactChanges` → `replacements`), which SARIF-aware tools can
  apply directly.

The pretty and HTML formatters are unchanged. This is what lets the VS Code
extension offer a per-finding "Apply fix" Quick Fix without re-running `--fix`.
