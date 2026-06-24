---
'oauthlint-rules': minor
---

feat(rules): Rust rule packs. The language-aware infrastructure now also covers
Rust — `.rs` fixtures, `auth.rust.<category>.<name>` ids, and `rust` doc
fences — with zero change to existing JS/TS, Python, Go, or Java rules. Ships
the first Rust rule, `auth.rust.tls.accept-invalid-certs` (reqwest
`danger_accept_invalid_certs(true)`, CWE-295).
