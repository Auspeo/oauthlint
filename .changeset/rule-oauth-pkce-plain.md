---
'oauthlint-rules': minor
---

feat(rules): add `auth.oauth.pkce-plain` (AUTH-OAUTH-011). Flags PKCE
configured with `code_challenge_method=plain` instead of `S256`. The `plain`
method sends the `code_verifier` verbatim as the `code_challenge`, so PKCE
offers no protection against authorization-code interception (CWE-757). Detects
the query-string form (inline authorize URL / template fragment), object
literals `{ code_challenge_method: 'plain' }`, and `URLSearchParams`
`.set()`/`.append()` calls. Matches only the literal `plain` value, never
`S256`.
