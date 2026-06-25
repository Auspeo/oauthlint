---
'oauthlint-rules': patch
---

fix(rules): eliminate two false positives surfaced by hand-verifying the
AI-codegen benchmark.

- `auth.oauth.no-state-validation` no longer fires when `state` is read into a
  local variable and validated afterwards
  (`const state = url.searchParams.get('state'); ...; if (expected !== state)`).
  The rule previously only recognized validation done inline inside the `if`.
- `auth.cors.reflect-origin` no longer fires on an allowlist callback that gates
  `cb(null, true)` behind an origin check (`if (allow.has(origin)) cb(null, true)`)
  — the exact safe shape the rule's own message recommends. It now flags only
  block/function callbacks that ignore their origin argument and allow
  unconditionally. New vulnerable + safe fixtures lock in both shapes.
