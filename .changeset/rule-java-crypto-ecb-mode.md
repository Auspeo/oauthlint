---
'oauthlint-rules': minor
---

feat(rules): add `auth.java.crypto.ecb-mode` (AUTH-JAVA-CRYPTO-003).
Flags JCA `Cipher.getInstance(...)` calls that use ECB mode or a bare cipher
alias that defaults to ECB — `"AES/ECB/..."` (any padding), `"AES"`, `"DES"`,
`"DESede"`, `"Blowfish"` (CWE-327). ECB is deterministic and leaks plaintext
structure. A `metavariable-regex` scopes matching to symmetric block ciphers,
so authenticated/CBC transforms (`"AES/GCM/NoPadding"`, `"AES/CBC/PKCS5Padding"`)
and asymmetric `"RSA/ECB/OAEPWith..."` are not flagged.
