# `auth.go.cors.allow-all`

> CORS is configured to allow every origin with the wildcard `*`. Any

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-CORS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| **OWASP** | A05:2021 |
| **Languages** | go |
| **Technologies** | gin, rs-cors, net/http |

## Why this matters

CORS is configured to allow every origin with the wildcard `*`. Any
website can then make cross-origin requests to this endpoint, defeating
the same-origin policy (CWE-942). This is a common AI-generated mistake —
`AllowAllOrigins: true`, `AllowedOrigins: []string{"*"}`, or a raw
`Access-Control-Allow-Origin: *` header is pasted in to "make the browser
call work" and the intended scope is never added. Combined with
credentials this becomes an account-takeover primitive that leaks
OAuth/OIDC tokens cross-origin.

Restrict CORS to an explicit allowlist of trusted origins instead, for
example `AllowOrigins: []string{"https://app.example.com"}` (gin-contrib),
`AllowedOrigins: []string{"https://app.example.com"}` (rs/cors), or
`w.Header().Set("Access-Control-Allow-Origin", "https://app.example.com")`.

## ❌ Vulnerable

```go
package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	rscors "github.com/rs/cors"
)

func ginAllowAll() cors.Config {
	// ruleid: auth.go.cors.allow-all
	return cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST"},
	}
}

func rsAllowAll() *rscors.Cors {
	// ruleid: auth.go.cors.allow-all
	return rscors.New(rscors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST"},
	})
}

func rawHeaderAllowAll(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.cors.allow-all
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
}
```

## ✅ Safe

```go
package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	rscors "github.com/rs/cors"
)

// ok: auth.go.cors.allow-all -- gin-contrib explicit allowlist, not AllowAllOrigins
func ginAllowlist() cors.Config {
	return cors.Config{
		AllowOrigins: []string{"https://app.example.com"},
		AllowMethods: []string{"GET", "POST"},
	}
}

// ok: auth.go.cors.allow-all -- rs/cors explicit allowlist, no wildcard
func rsAllowlist() *rscors.Cors {
	return rscors.New(rscors.Options{
		AllowedOrigins: []string{"https://app.example.com"},
		AllowedMethods: []string{"GET", "POST"},
	})
}

// ok: auth.go.cors.allow-all -- raw header set to an explicit trusted origin
func rawHeaderAllowlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "https://app.example.com")
	w.WriteHeader(http.StatusOK)
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.cors.allow-all -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://github.com/gin-contrib/cors
- https://github.com/rs/cors
- https://cwe.mitre.org/data/definitions/942.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
