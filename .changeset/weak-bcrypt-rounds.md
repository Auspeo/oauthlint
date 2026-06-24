---
'oauthlint-rules': minor
---

feat(rules): add `auth.flow.weak-bcrypt-rounds` (AUTH-FLOW-007). Flags bcrypt
cost factors below 10 in `bcrypt.hash`/`hashSync`/`genSalt`/`genSaltSync`
(and `bcryptjs`), which make stolen password hashes cheap to brute-force.
Uses `metavariable-comparison` so only numeric literals under the threshold
match — variables and constants (`bcrypt.hash(pw, saltRounds)`) are ignored.
OWASP recommends a cost of ≥ 12.
