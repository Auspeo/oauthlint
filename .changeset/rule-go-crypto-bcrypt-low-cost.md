---
'oauthlint-rules': minor
---

Add `auth.go.crypto.bcrypt-low-cost` (AUTH-GO-CRYPTO-002, CWE-916). Flags Go
code that calls `bcrypt.GenerateFromPassword` (from `golang.org/x/crypto/bcrypt`)
with a numeric cost literal below 10. A low bcrypt work factor makes each hash
cheap to compute, letting an attacker brute-force stolen password hashes far
too quickly; OWASP recommends a cost of at least 10 and ≥ 12 for new
applications. To keep false positives low, a `metavariable-comparison`
constrains the match to numeric literals < 10, so `bcrypt.DefaultCost`, a cost
≥ 10, and a cost passed via a variable are not flagged.
