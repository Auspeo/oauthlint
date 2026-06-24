---
'oauthlint-rules': minor
---

feat(rules): add `auth.java.tls.trust-all-certs` (AUTH-JAVA-TLS-001). Flags
disabled TLS hostname verification: a `HostnameVerifier` lambda that always
returns `true` (`(host, session) -> true`), an anonymous `HostnameVerifier`
whose `verify(...)` just returns `true`, and Apache HttpClient's
`NoopHostnameVerifier` (constructor or `INSTANCE`). A permissive verifier
accepts any certificate regardless of the host it was issued for, enabling
man-in-the-middle attacks (CWE-295, OWASP A02:2021). A verifier with real
hostname-matching logic and the default verification (no `setHostnameVerifier`
call) are not flagged.
