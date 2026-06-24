# `auth.go.jwt.hardcoded-secret`

> A JWT HMAC signing/verification key is hardcoded as a string literal in a

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-JWT-003` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API2:2023 |
| **Languages** | go |
| **Technologies** | golang-jwt |

## Why this matters

A JWT HMAC signing/verification key is hardcoded as a string literal in a
call to golang-jwt. Anyone who can read the source or git history can
forge or tamper with tokens, which is a complete authentication bypass.

Load the secret from the environment or a secret manager instead, e.g.
`key := []byte(os.Getenv("JWT_SECRET"))` and `token.SignedString(key)`.
Never commit signing keys to source control.

## ❌ Vulnerable

```go
package main

import (
	"github.com/golang-jwt/jwt/v5"
)

func signWithLiteral() (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	// ruleid: auth.go.jwt.hardcoded-secret
	return token.SignedString([]byte("super-secret-signing-key"))
}

func parseWithLiteralKeyfunc(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		// ruleid: auth.go.jwt.hardcoded-secret
		return []byte("super-secret-signing-key"), nil
	})
}
```

## ✅ Safe

```go
package main

import (
	"os"

	"github.com/golang-jwt/jwt/v5"
)

func signFromEnv() (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	// ok: auth.go.jwt.hardcoded-secret
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func signFromVar(secret []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	// ok: auth.go.jwt.hardcoded-secret
	return token.SignedString(secret)
}

func parseFromEnvKeyfunc(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		// ok: auth.go.jwt.hardcoded-secret
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.jwt.hardcoded-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/github.com/golang-jwt/jwt/v5#Token.SignedString
- https://cwe.mitre.org/data/definitions/798.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
