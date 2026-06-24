---
'oauthlint-rules': minor
---

feat(rules): add `auth.java.crypto.insecure-random` (AUTH-JAVA-CRYPTO-002).
Flags security-sensitive values (token, secret, key, password, nonce, OTP,
salt) generated with a non-cryptographic PRNG — `new java.util.Random().nextInt/
nextLong/...`, `Math.random()`, or a `Random.nextBytes(buf)` filling a secret
buffer (CWE-330). Anchored on the target's name so non-secret uses
(`new Random().nextInt(10)` for an index or jitter) and `SecureRandom` are not
flagged.
