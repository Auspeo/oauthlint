# `auth.go.crypto.weak-password-hash`

> A password is being hashed with a fast, general-purpose digest from the

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-CRYPTO-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | go |
| **Technologies** | crypto/md5, crypto/sha256 |

## Why this matters

A password is being hashed with a fast, general-purpose digest from the
Go standard library (MD5, SHA-1, SHA-256, SHA-512). These algorithms are
designed to be fast, which makes offline brute-force and rainbow-table
attacks cheap — they are NOT suitable for storing passwords (CWE-916).

Use a dedicated, slow password-hashing function with a per-password salt
and a tunable work factor: bcrypt
(`golang.org/x/crypto/bcrypt.GenerateFromPassword`), Argon2
(`golang.org/x/crypto/argon2.IDKey`), or scrypt
(`golang.org/x/crypto/scrypt.Key`). These resist brute-force by design.

## ❌ Vulnerable

```go
package main

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"fmt"
)

func hashWithMD5(password string) [16]byte {
	// ruleid: auth.go.crypto.weak-password-hash
	return md5.Sum([]byte(password))
}

func hashWithSHA1(password string) [20]byte {
	// ruleid: auth.go.crypto.weak-password-hash
	return sha1.Sum([]byte(password))
}

func hashWithSHA256(password string) [32]byte {
	// ruleid: auth.go.crypto.weak-password-hash
	return sha256.Sum256([]byte(password))
}

func hashWithWriter(password string) []byte {
	h := sha256.New()
	// ruleid: auth.go.crypto.weak-password-hash
	h.Write([]byte(password))
	return h.Sum(nil)
}

func main() {
	fmt.Println(
		hashWithMD5("hunter2"),
		hashWithSHA1("hunter2"),
		hashWithSHA256("hunter2"),
		hashWithWriter("hunter2"),
	)
}
```

## ✅ Safe

```go
package main

import (
	"crypto/sha256"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Secure: passwords are hashed with bcrypt, a slow, salted password hasher.
func hashPassword(password string) ([]byte, error) {
	// ok: auth.go.crypto.weak-password-hash
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

// Non-password use of a fast digest: checksumming file contents. Not flagged.
func checksum(fileBytes []byte) [32]byte {
	// ok: auth.go.crypto.weak-password-hash
	return sha256.Sum256(fileBytes)
}

func main() {
	hash, _ := hashPassword("hunter2")
	fmt.Println(hash, checksum([]byte("file contents")))
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.crypto.weak-password-hash -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/916.html
- https://pkg.go.dev/golang.org/x/crypto/bcrypt
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
