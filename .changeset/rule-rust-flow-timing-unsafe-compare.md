---
'oauthlint-rules': minor
---

Add `auth.rust.flow.timing-unsafe-compare` (AUTH-RUST-FLOW-001, CWE-208).
Flags secret-shaped values (`password`, `token`, `secret`, `apikey`, `hmac`,
`signature`, `mac`, `digest`) compared with `==` / `!=` in Rust. `PartialEq`
for slices and strings short-circuits on the first differing byte, so the
comparison time leaks the matching-prefix length — a classic timing-attack
vector. The rule recommends a constant-time comparison (`subtle::ConstantTimeEq`
or the `constant_time_eq` crate). Anchored to a secret-shaped variable name
(metavariable-regex) and carved out for non-content comparisons — length checks
(`token.len() == 32`), string-literal comparisons (`secret == "demo"`), and
`None` presence checks — so ordinary equality is not flagged.
