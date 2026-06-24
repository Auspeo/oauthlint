---
'oauthlint-rules': minor
---

Add `auth.go.crypto.weak-cipher` (AUTH-GO-CRYPTO-003, CWE-327). Flags use of
broken or deprecated ciphers to protect sensitive data: DES
(`des.NewCipher`), 3DES (`des.NewTripleDESCipher`), and RC4 (`rc4.NewCipher`).
These have 64-bit blocks (Sweet32) or known keystream biases (RFC 7465) and
leave tokens and secrets inadequately protected. Use authenticated AES-GCM
instead (`aes.NewCipher` + `cipher.NewGCM`); `aes.NewCipher` is not flagged.
