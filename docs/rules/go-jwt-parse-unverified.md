# `auth.go.jwt.parse-unverified`

> A JWT is decoded with `ParseUnverified`, which parses the token WITHOUT

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-JWT-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | go |
| **Technologies** | golang-jwt |

## Why this matters

A JWT is decoded with `ParseUnverified`, which parses the token WITHOUT
checking its signature. Any claims read from the result are fully
attacker-controlled — an attacker can forge arbitrary subjects, scopes,
or expiry and the token will still parse. Trusting these claims for
authentication or authorization is a complete auth bypass (CWE-347).

Verify the signature instead: use `jwt.Parse(tok, keyfunc)` or
`jwt.ParseWithClaims(tok, claims, keyfunc)` with a `Keyfunc` that returns
the expected signing key, so a token with a bad or missing signature is
rejected.

## ❌ Vulnerable

```go
package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Decodes the token without verifying its signature, then trusts the claims.
func subjectFromParser(tok string) string {
	parser := jwt.NewParser()
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.parse-unverified
	parser.ParseUnverified(tok, claims)
	return fmt.Sprintf("%v", claims["sub"])
}

// Inline parser construction, same unsafe path.
func subjectInline(tok string) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.parse-unverified
	jwt.NewParser().ParseUnverified(tok, claims)
	return fmt.Sprintf("%v", claims["sub"])
}

// new(jwt.Parser) receiver.
func subjectNewParser(tok string) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.parse-unverified
	new(jwt.Parser).ParseUnverified(tok, claims)
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

func keyfunc(token *jwt.Token) (interface{}, error) {
	return []byte("secret"), nil
}

// jwt.Parse verifies the signature via the keyfunc.
func subjectVerified(tok string) string {
	// ok: auth.go.jwt.parse-unverified
	parsed, err := jwt.Parse(tok, keyfunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// jwt.ParseWithClaims also verifies the signature.
func subjectVerifiedClaims(tok string) string {
	claims := jwt.MapClaims{}
	// ok: auth.go.jwt.parse-unverified
	parsed, err := jwt.ParseWithClaims(tok, claims, keyfunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.jwt.parse-unverified -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/github.com/golang-jwt/jwt/v5#Parser.ParseUnverified
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
