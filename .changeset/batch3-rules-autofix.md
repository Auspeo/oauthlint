---
"oauthlint-rules": patch
---

feat(rules): 3 new rules (→ 100) + expand safe autofixes

- `auth.oauth.access-token-in-url` (JS/TS, CWE-598) — OAuth token in a URL query string.
- `auth.rust.jwt.no-issuer-validation` (Rust/jsonwebtoken, CWE-345) — decode without validating `iss`.
- `auth.java.crypto.weak-hash` (Java, CWE-328) — `MessageDigest` with MD5/SHA-1.
- Added safe `--fix` autofixes to `auth.rust.tls.accept-invalid-certs` and
  `auth.rust.tls.accept-invalid-hostnames` (`true` → `false`).
