---
'oauthlint-rules': minor
---

Add `auth.rust.crypto.bcrypt-low-cost` (AUTH-RUST-CRYPTO-002, CWE-916).
Flags `bcrypt::hash` / `bcrypt::hash_with_result` called with a numeric
literal cost factor below 10 in Rust (e.g. `bcrypt::hash(password, 8)`). A low
work factor makes each hash cheap to compute, letting attackers brute-force
stolen password hashes too quickly. A `metavariable-comparison` constrains the
match to numeric literals < 10, so `bcrypt::DEFAULT_COST`, a cost ≥ 10, or a
cost passed via a variable are not flagged. Recommends `bcrypt::DEFAULT_COST`
(12) or a cost factor of 12 or higher.
