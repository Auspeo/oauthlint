---
'oauthlint-rules': minor
---

feat(rules): add `auth.go.tls.min-version` (AUTH-GO-TLS-002). Flags a
`tls.Config` whose `MinVersion` is pinned to an obsolete protocol
(`tls.VersionSSL30`, `tls.VersionTLS10`, or `tls.VersionTLS11`), which exposes
OAuth/OIDC traffic to downgrade attacks (POODLE, BEAST). Requires at least
`tls.VersionTLS12`. CWE-326, OWASP A02:2021.
