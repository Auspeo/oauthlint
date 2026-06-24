# `auth.go.tls.insecure-skip-verify`

> A `tls.Config` is created with `InsecureSkipVerify: true`, which disables

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-TLS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-295](https://cwe.mitre.org/data/definitions/295.html) |
| **OWASP** | A02:2021 |
| **Languages** | go |
| **Technologies** | crypto/tls |

## Why this matters

A `tls.Config` is created with `InsecureSkipVerify: true`, which disables
verification of the server's certificate chain and host name. Any
attacker who can intercept the connection can present any certificate
and read or tamper with the traffic — a classic man-in-the-middle hole.
For OAuth/OIDC this leaks authorization codes, access tokens, and client
secrets in transit.

Never set `InsecureSkipVerify: true`. Leave verification on (the default).
To trust a private CA in development, set `RootCAs` to a `*x509.CertPool`
loaded with that CA instead.

## ❌ Vulnerable

```go
package main

import (
	"crypto/tls"
	"net/http"
)

func badClient() *http.Client {
	// ruleid: auth.go.tls.insecure-skip-verify
	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	return &http.Client{Transport: tr}
}

func badConfig() *tls.Config {
	// ruleid: auth.go.tls.insecure-skip-verify
	return &tls.Config{MinVersion: tls.VersionTLS12, InsecureSkipVerify: true}
}
```

## ✅ Safe

```go
package main

import (
	"crypto/tls"
	"crypto/x509"
)

// ok: auth.go.tls.insecure-skip-verify -- verification left on (default)
func goodDefault() *tls.Config {
	return &tls.Config{MinVersion: tls.VersionTLS12}
}

// ok: auth.go.tls.insecure-skip-verify -- explicitly false
func explicitFalse() *tls.Config {
	return &tls.Config{InsecureSkipVerify: false}
}

// ok: auth.go.tls.insecure-skip-verify -- private CA via RootCAs, not skipping
func privateCA(pool *x509.CertPool) *tls.Config {
	return &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.tls.insecure-skip-verify -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/crypto/tls#Config
- https://cwe.mitre.org/data/definitions/295.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
