---
'oauthlint-rules': minor
---

Add rule `auth.py.flow.weak-password-hash` (AUTH-PY-FLOW-001, CWE-916): flags
passwords hashed with fast/broken `hashlib` digests (`md5`/`sha1`/`sha256`/`sha512`),
including the `h = hashlib.sha256(); h.update(password)` form and
`password.encode()` arguments, and recommends bcrypt/argon2 (argon2-cffi)/passlib/scrypt.
Anchored on a password-named argument to avoid false positives on file/content
checksums (`hashlib.sha256(file_bytes)`), HMAC signatures, and real password hashers.
