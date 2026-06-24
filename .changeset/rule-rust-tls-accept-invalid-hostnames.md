---
'oauthlint-rules': minor
---

Add `auth.rust.tls.accept-invalid-hostnames` (AUTH-RUST-TLS-002): flags a
reqwest client built with `danger_accept_invalid_hostnames(true)`, which turns
off TLS hostname verification. A certificate valid for any other domain is then
accepted, letting an attacker holding a valid certificate for a host they
control mount a man-in-the-middle attack and steal OAuth/OIDC authorization
codes, access tokens, and client secrets in transit (CWE-297, OWASP A02:2021).
Only the literal `true` is matched; `danger_accept_invalid_hostnames(false)` and
the absence of the call are not flagged. Distinct from
`auth.rust.tls.accept-invalid-certs`, which targets `danger_accept_invalid_certs`.
