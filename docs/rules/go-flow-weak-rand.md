# `auth.go.flow.weak-rand`

> A security-sensitive value — its name indicates a token, secret, key,

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-FLOW-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-330](https://cwe.mitre.org/data/definitions/330.html) |
| **OWASP** | A02:2021 |
| **Languages** | go |
| **Technologies** | math/rand |

## Why this matters

A security-sensitive value — its name indicates a token, secret, key,
password, nonce, OTP, or salt — is being generated with the `math/rand`
package. `math/rand` is a deterministic PRNG: its output is predictable
and an attacker who observes enough values can recover the seed and
forecast every future token. For OAuth/OIDC this means forgeable
`state` values, guessable authorization codes, and predictable refresh
tokens.

Use `crypto/rand` instead: allocate a byte slice and fill it with
`rand.Read(b)` (from `crypto/rand`), then hex- or base64url-encode it.
Never derive a credential from `math/rand`.

## ❌ Vulnerable

```go
package main

import (
	"fmt"
	"math/rand"
)

func makeToken() int64 {
	// ruleid: auth.go.flow.weak-rand
	token := rand.Int63()
	return token
}

func makeSecret() int {
	// ruleid: auth.go.flow.weak-rand
	secret := rand.Intn(1000000)
	return secret
}

func makeOTP() int {
	var otp int
	// ruleid: auth.go.flow.weak-rand
	otp = rand.Intn(999999)
	return otp
}

func makeSessionKey() float64 {
	// ruleid: auth.go.flow.weak-rand
	sessionKey := rand.Float64()
	return sessionKey
}

func main() {
	fmt.Println(makeToken(), makeSecret(), makeOTP(), makeSessionKey())
}
```

## ✅ Safe

```go
package main

import (
	crand "crypto/rand"
	"encoding/hex"
	"fmt"
	"math/rand"
)

// Secure: token comes from crypto/rand via rand.Read, not math/rand.
func makeToken() string {
	b := make([]byte, 32)
	// ok: auth.go.flow.weak-rand
	_, _ = crand.Read(b)
	return hex.EncodeToString(b)
}

// Non-secret use of math/rand: a loop index / jitter. Not flagged.
func pickIndex() int {
	// ok: auth.go.flow.weak-rand
	i := rand.Intn(10)
	return i
}

// Non-secret use: retry backoff jitter.
func backoff() int {
	// ok: auth.go.flow.weak-rand
	delay := rand.Intn(500)
	return delay
}

func main() {
	fmt.Println(makeToken(), pickIndex(), backoff())
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.flow.weak-rand -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/crypto/rand#Read
- https://cwe.mitre.org/data/definitions/330.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
