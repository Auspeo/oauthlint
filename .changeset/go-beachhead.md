---
'oauthlint-rules': minor
---

feat(rules): Go rule packs. The language-aware infrastructure now also covers
Go — `.go` fixtures, `auth.go.<category>.<name>` ids, and `go` doc fences —
with zero change to JS/TS or Python rules. Ships the first Go rule,
`auth.go.tls.insecure-skip-verify` (crypto/tls `InsecureSkipVerify: true`,
CWE-295).
