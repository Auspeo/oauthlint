---
'oauthlint-rules': minor
---

feat(rules): multi-language support — Python rule packs. The rule schema, the
loader/fixture contract, and the docs generator now understand a language
segment (`auth.<lang>.<category>.<name>`, e.g. `auth.py.jwt.no-verify`) and
`.py` fixtures, with zero change to existing JS/TS rule ids or doc URLs. Ships
the first Python rule, `auth.py.jwt.no-verify` (PyJWT signature verification
disabled, CWE-347).
