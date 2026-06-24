# `auth.go.jwt.unchecked-method`

> A `Keyfunc` passed to `jwt.Parse`/`jwt.ParseWithClaims` returns the

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-JWT-004` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | go |
| **Technologies** | golang-jwt |

## Why this matters

A `Keyfunc` passed to `jwt.Parse`/`jwt.ParseWithClaims` returns the
verification key WITHOUT first checking `token.Method` (the signing
algorithm). This enables an algorithm-confusion attack: if the server
verifies RS256 tokens with an RSA public key, an attacker can forge a
token signed with HS256 using that public key as the HMAC secret, and the
library will accept it — a complete authentication bypass (CWE-347).

Always assert the signing method inside the keyfunc before returning the
key, e.g.:
`if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok { return nil, err }`
(or `*jwt.SigningMethodRSA` / `*jwt.SigningMethodECDSA` as appropriate),
so a token signed with an unexpected algorithm is rejected.

## ❌ Vulnerable

```go
package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Case 1: jwt.Parse with a keyfunc that returns the key WITHOUT checking
// token.Method. An attacker can sign with HS256 using the public RSA key.
func parseUnchecked(tok string, key interface{}) string {
	// ruleid: auth.go.jwt.unchecked-method
	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// Case 2: jwt.ParseWithClaims with the same unchecked keyfunc.
func parseWithClaimsUnchecked(tok string, key interface{}) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.unchecked-method
	parsed, err := jwt.ParseWithClaims(tok, claims, func(t *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}
```

## ✅ Safe

```go
package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Keyfunc that verifies the signing method is HMAC before returning the key.
func parseChecked(tok string, key interface{}) string {
	// ok: auth.go.jwt.unchecked-method
	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// ParseWithClaims with a keyfunc that checks for RSA before returning the key.
func parseWithClaimsChecked(tok string, key interface{}) string {
	claims := jwt.MapClaims{}
	// ok: auth.go.jwt.unchecked-method
	parsed, err := jwt.ParseWithClaims(tok, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}

// Keyfunc that checks token.Method via a direct comparison before returning.
func parseCheckedCompare(tok string, key interface{}) string {
	// ok: auth.go.jwt.unchecked-method
	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("bad alg")
		}
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.jwt.unchecked-method -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/github.com/golang-jwt/jwt/v5#Keyfunc
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
