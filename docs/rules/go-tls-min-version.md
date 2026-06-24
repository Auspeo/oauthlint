# `auth.go.tls.min-version`

> A `tls.Config` is created with `MinVersion` pinned to an obsolete

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-TLS-002` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-326](https://cwe.mitre.org/data/definitions/326.html) |
| **OWASP** | A02:2021 |
| **Languages** | go |
| **Technologies** | crypto/tls |

## Why this matters

A `tls.Config` is created with `MinVersion` pinned to an obsolete
protocol — SSL 3.0, TLS 1.0, or TLS 1.1. These versions have known
cryptographic weaknesses (POODLE, BEAST, downgrade attacks) and are
deprecated by RFC 8996. Allowing them lets an attacker negotiate a
broken cipher and intercept or tamper with OAuth/OIDC traffic,
leaking authorization codes, access tokens, and client secrets.

Set `MinVersion` to at least `tls.VersionTLS12`, and ideally
`tls.VersionTLS13`, so the handshake refuses obsolete protocols.

## ❌ Vulnerable

```go
package main

import (
	"crypto/tls"
	"net/http"
)

func tls10Client() *http.Client {
	// ruleid: auth.go.tls.min-version
	tr := &http.Transport{TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS10}}
	return &http.Client{Transport: tr}
}

func tls11Config() *tls.Config {
	// ruleid: auth.go.tls.min-version
	return &tls.Config{MinVersion: tls.VersionTLS11}
}

func ssl30Config() tls.Config {
	// ruleid: auth.go.tls.min-version
	return tls.Config{MinVersion: tls.VersionSSL30}
}
```

## ✅ Safe

```go
package main

import (
	"crypto/tls"
	"net/http"
)

func tls12Client() *http.Client {
	// ok: auth.go.tls.min-version
	tr := &http.Transport{TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12}}
	return &http.Client{Transport: tr}
}

func tls13Config() *tls.Config {
	// ok: auth.go.tls.min-version
	return &tls.Config{MinVersion: tls.VersionTLS13}
}

func defaultConfig() *tls.Config {
	// ok: auth.go.tls.min-version
	return &tls.Config{}
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.tls.min-version -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/crypto/tls#Config
- https://datatracker.ietf.org/doc/html/rfc8996
- https://cwe.mitre.org/data/definitions/326.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
