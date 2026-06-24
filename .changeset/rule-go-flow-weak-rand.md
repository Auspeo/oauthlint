---
'oauthlint-rules': minor
---

Add `auth.go.flow.weak-rand` (AUTH-GO-FLOW-001, CWE-330). Flags Go code that
generates a security-sensitive value with the `math/rand` package instead of
`crypto/rand`. The rule matches the math/rand-exclusive generators
(`rand.Intn`, `rand.Int`, `rand.Int31`, `rand.Int63`, `rand.Float64`,
`rand.Perm`) when their result is assigned (`:=` or `=`) to an identifier
whose name looks like a secret (`token`, `secret`, `key`, `password`, `nonce`,
`otp`, `salt`). `math/rand` is a deterministic PRNG, so any credential derived
from it is predictable; `crypto/rand` (`rand.Read`) is the correct source.
To keep false positives low, `rand.Read` is never flagged (it also exists in
`crypto/rand`, the safe path) and non-secret uses such as `i := rand.Intn(10)`
loop indices or `delay := rand.Intn(500)` backoff jitter are ignored.
