---
"oauthlint-rules": patch
---

feat(rules): JWT algorithm-confusion detection for Python and Rust

`auth.py.jwt.algorithm-confusion` (PyJWT) and `auth.rust.jwt.algorithm-confusion` (jsonwebtoken)
flag an `algorithms` allowlist that mixes a symmetric (HS*) with an asymmetric (RS*/ES*/PS*) family
— the classic key-confusion forgery (CWE-327). Parity with the JS/TS rule.
