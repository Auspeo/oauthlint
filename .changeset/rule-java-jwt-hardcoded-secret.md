---
'oauthlint-rules': minor
---

Add `auth.java.jwt.hardcoded-secret` (AUTH-JAVA-JWT-002, CWE-798). Flags jjwt
(io.jsonwebtoken) signing keys hard-coded as string literals —
`Keys.hmacShaKeyFor("literal".getBytes(...))`, the legacy
`signWith(SignatureAlgorithm.HS256, "literal")`, and
`setSigningKey("literal")` / `setSigningKey("literal".getBytes(...))` on the
parser side. A committed signing key lets anyone with source, build, or VCS
access forge valid tokens. Matches only string literals in a key position;
variables, `System.getenv(...)`, and loaded `Key`/`SecretKey` values are not
flagged. Complements `auth.java.jwt.unsigned-jwt` (AUTH-JAVA-JWT-001).
