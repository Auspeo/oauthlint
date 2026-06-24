---
'oauthlint-rules': minor
---

Add `auth.cors.null-origin` (AUTH-CORS-003, CWE-942). Flags CORS policies that
allow the literal origin `'null'` — `res.setHeader('Access-Control-Allow-Origin', 'null')`,
`cors({ origin: 'null' })`, and allowlists containing `'null'` (inline array or
an indirected array variable). Sandboxed iframes, `file://` documents, and some
cross-origin redirects send `Origin: null`, so allowing the `'null'` string
grants cross-origin access to attacker-controlled contexts and defeats the
same-origin policy. Matches only the literal string `'null'`/`"null"`, never the
`null` keyword or real origins. Complements `auth.cors.wildcard-with-credentials`
(literal `*`) and `auth.cors.reflect-origin` (dynamic reflection).
