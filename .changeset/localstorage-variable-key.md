---
'oauthlint-rules': patch
---

fix(rules): `auth.jwt.localstorage` now catches token-named values, not just
token-named string-literal keys. The common shape
`localStorage.setItem(TOKEN_KEY, token)` — where the storage key is a variable —
was previously missed. Surfaced by the AI-codegen benchmark; validated to still
fire 0 on the clean JS auth libraries.
