---
'oauthlint-rules': minor
---

Add rule `auth.flow.weak-password-hash` (AUTH-FLOW-006, CWE-916): flags passwords hashed with fast/broken hashes (`crypto.createHash('md5'|'sha1'|'sha256'|'sha512')`) and recommends bcrypt/argon2/scrypt, while avoiding false positives on checksums, file digests, and HMAC signatures.
