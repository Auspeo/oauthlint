# `auth.go.crypto.bcrypt-low-cost`

> `bcrypt.GenerateFromPassword` is called with a cost factor below 10. A

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-CRYPTO-002` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | go |
| **Technologies** | bcrypt |

## Why this matters

`bcrypt.GenerateFromPassword` is called with a cost factor below 10. A
low work factor makes each hash cheap to compute, which lets an attacker
brute-force stolen password hashes far too quickly. OWASP recommends a
bcrypt cost of at least 10, and ≥ 12 for new applications, tuned so a
single hash takes roughly 250ms on your hardware.

Common LLM-generated mistake: `bcrypt.GenerateFromPassword(pw, 8)`
because the literal "looks fast enough". Use `bcrypt.DefaultCost` (10)
or raise the cost factor to 12 or higher.

## ❌ Vulnerable

```go
package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Cost factor far too low.
func hashWeak(pw []byte) []byte {
	// ruleid: auth.go.crypto.bcrypt-low-cost
	h, _ := bcrypt.GenerateFromPassword(pw, 4)
	return h
}

// Below the recommended minimum of 10.
func hashLow(pw []byte) []byte {
	// ruleid: auth.go.crypto.bcrypt-low-cost
	h, _ := bcrypt.GenerateFromPassword(pw, 8)
	return h
}

// Still one short of DefaultCost.
func hashJustUnder(pw []byte) []byte {
	// ruleid: auth.go.crypto.bcrypt-low-cost
	h, _ := bcrypt.GenerateFromPassword(pw, 9)
	return h
}

func main() {
	pw := []byte("hunter2")
	fmt.Println(hashWeak(pw), hashLow(pw), hashJustUnder(pw))
}
```

## ✅ Safe

```go
package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Uses the package default cost (10). Not a numeric literal < 10.
func hashDefault(pw []byte) []byte {
	// ok: auth.go.crypto.bcrypt-low-cost
	h, _ := bcrypt.GenerateFromPassword(pw, bcrypt.DefaultCost)
	return h
}

// Explicit strong cost factor.
func hashStrong(pw []byte) []byte {
	// ok: auth.go.crypto.bcrypt-low-cost
	h, _ := bcrypt.GenerateFromPassword(pw, 12)
	return h
}

// Cost supplied via a variable, not a literal. Not flagged.
func hashVar(pw []byte, cost int) []byte {
	// ok: auth.go.crypto.bcrypt-low-cost
	h, _ := bcrypt.GenerateFromPassword(pw, cost)
	return h
}

func main() {
	pw := []byte("hunter2")
	fmt.Println(hashDefault(pw), hashStrong(pw), hashVar(pw, 14))
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.crypto.bcrypt-low-cost -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/golang.org/x/crypto/bcrypt#GenerateFromPassword
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cwe.mitre.org/data/definitions/916.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
