---
'oauthlint-rules': minor
---

Add `auth.java.jwt.unsigned-jwt` (AUTH-JAVA-JWT-001, CWE-347). Flags JWTs that
are created or parsed without a signature, so their claims are forgeable. Matches
nimbus-jose-jwt's unsecured `new PlainJWT(...)` and jjwt's unsigned parsing
(`parseClaimsJwt` / `parsePlaintextJwt`). Sign and verify instead: use
nimbus `SignedJWT`, or jjwt `Jwts.builder()...signWith(key)` parsed with
`parseSignedClaims` / `parseClaimsJws` — those signed APIs are not flagged.
