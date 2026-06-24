---
'oauthlint-rules': patch
---

fix(rules): stop `auth.flow.timing-unsafe-compare` flagging comparisons to
literals. Comparing a secret-named value to a string or boolean literal
(`pw !== 'password'`, `idToken === false`) is never a timing-attack target —
a literal baked into source is already public, so there is nothing to leak.
This was the dominant false-positive class on next-auth in real-world
validation (5 findings → 2 genuine ones).
