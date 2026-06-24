---
'oauthlint-rules': minor
---

feat(rules): add `auth.rust.cors.permissive` (AUTH-RUST-CORS-001). Flags
wide-open CORS policies in Rust web stacks — actix-web `Cors::permissive()`,
tower-http `CorsLayer::permissive()` / `CorsLayer::very_permissive()`, and
`CorsLayer::new().allow_origin(Any)`. Explicit origin allowlists are not
flagged. CWE-942, OWASP A05:2021.
