---
"oauthlint": minor
---

The human-readable scan output now shows a code frame for each finding: a few
lines of source context, a dim line-number gutter, and a caret under the matched
span, in the style of ESLint, ruff, and cargo. It is on by default for the
pretty format (json, SARIF, and HTML are unchanged) and can be turned off with
`--no-code-frame` or the `codeFrame` config option.
