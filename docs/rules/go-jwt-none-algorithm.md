# `auth.go.jwt.none-algorithm`

> A JWT is created or accepted with the `none` algorithm, which produces an

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-JWT-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | go |
| **Technologies** | golang-jwt |

## Why this matters

A JWT is created or accepted with the `none` algorithm, which produces an
unsigned token. Anyone can forge such a token by setting `alg: none` and
omitting the signature, so the server has no way to verify who issued it —
a complete authentication bypass (CWE-347). In golang-jwt this happens
when signing with `jwt.SigningMethodNone` or passing the
`jwt.UnsafeAllowNoneSignatureType` sentinel to `SignedString`.

Never use the `none` algorithm. Sign tokens with a real algorithm such as
HS256 (`jwt.SigningMethodHS256`), RS256 (`jwt.SigningMethodRS256`), or
ES256 (`jwt.SigningMethodES256`) and verify them with the matching key.

## ❌ Vulnerable

```go
package main

import (
	"github.com/golang-jwt/jwt/v5"
)

// Case 1: signing a token with the `none` method via NewWithClaims.
func signNone() *jwt.Token {
	// ruleid: auth.go.jwt.none-algorithm
	return jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"sub": "1234567890",
	})
}

// Case 2: passing the UnsafeAllowNoneSignatureType sentinel to SignedString.
func signWithUnsafeSentinel(token *jwt.Token) (string, error) {
	// ruleid: auth.go.jwt.none-algorithm
	return token.SignedString(jwt.UnsafeAllowNoneSignatureType)
}

// Case 3: building a token with the none method via jwt.New.
func newNone() *jwt.Token {
	// ruleid: auth.go.jwt.none-algorithm
	return jwt.New(jwt.SigningMethodNone)
}
```

## ✅ Safe

```go
package main

import (
	"github.com/golang-jwt/jwt/v5"
)

// ok: auth.go.jwt.none-algorithm
func signHS256(secret []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	return token.SignedString([]byte(secret))
}

// ok: auth.go.jwt.none-algorithm
func signRS256(token *jwt.Token, key interface{}) (string, error) {
	token = jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"sub": "abc",
	})
	return token.SignedString(key)
}

// ok: auth.go.jwt.none-algorithm
func signES256(key interface{}) jwt.SigningMethod {
	return jwt.SigningMethodES256
}

// ok: auth.go.jwt.none-algorithm -- defensively REJECTING none is not a misuse
func rejectNone(token *jwt.Token) error {
	if token.Method == jwt.SigningMethodNone {
		return jwt.ErrTokenUnverifiable
	}
	return nil
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.jwt.none-algorithm -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/github.com/golang-jwt/jwt/v5#pkg-variables
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
