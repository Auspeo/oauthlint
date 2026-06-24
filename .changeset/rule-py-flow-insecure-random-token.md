---
'oauthlint-rules': minor
---

Add rule `auth.py.flow.insecure-random-token` (AUTH-PY-FLOW-004, CWE-330): flags
security-sensitive values (token, secret, password, OTP, nonce, API key,
reset/verification code) generated with the non-cryptographic `random` module
(`random.random()`, `randint`, `choice`, `choices`, `getrandbits`,
`"".join(random.choice(...) for ...)`), and recommends `secrets`
(`token_urlsafe`/`token_hex`/`choice`) or `os.urandom`. Anchored on the
secret-named assignment target via `metavariable-regex` to avoid false positives
on non-security uses of `random` (jitter, sampling, colors) and never matches
`secrets.*` or `os.urandom`.
