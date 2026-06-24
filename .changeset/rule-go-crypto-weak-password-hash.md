---
'oauthlint-rules': minor
---

Add `auth.go.crypto.weak-password-hash` (AUTH-GO-CRYPTO-001, CWE-916). Flags
passwords hashed with a fast, general-purpose digest from the Go standard
library — `md5.Sum`, `sha1.Sum`, `sha256.Sum256`, `sha512.Sum512`, and the
streaming `h := md5.New(); h.Write([]byte(password))` writer form. Fast digests
make offline brute-force and rainbow-table attacks cheap and are unsuitable for
password storage. The rule is anchored to the "password" character of the
hashed argument (metavariable-regex), so file checksums such as
`sha256.Sum256(fileBytes)` are not flagged, and proper password hashers
(`bcrypt`, `argon2`, `scrypt`) are recommended instead.
