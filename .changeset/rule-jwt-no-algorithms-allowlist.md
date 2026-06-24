---
'oauthlint-rules': minor
---

Add `auth.jwt.no-algorithms-allowlist` (AUTH-JWT-010, CWE-347). Flags
`jwt.verify(...)` from `jsonwebtoken` called without an explicit `algorithms`
allowlist — accepting any algorithm enables algorithm-confusion attacks (and
`alg: none` on older versions). Always pass `{ algorithms: ['RS256'] }` (or the
algorithm you expect). Scoped to the `jwt` alias; `jwt.verify` calls that
already pin `algorithms`, as well as `jwt.sign`, `jwt.decode`, and
`jose.jwtVerify`, are not matched.
