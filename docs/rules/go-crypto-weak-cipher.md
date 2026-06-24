# `auth.go.crypto.weak-cipher`

> A broken or deprecated block/stream cipher is used to protect data. DES

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-CRYPTO-003` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) |
| **OWASP** | A02:2021 |
| **Languages** | go |
| **Technologies** | crypto/des, crypto/rc4 |

## Why this matters

A broken or deprecated block/stream cipher is used to protect data. DES
(`des.NewCipher`) and 3DES (`des.NewTripleDESCipher`) have a 64-bit block
and are considered insecure (Sweet32, brute-force), while RC4
(`rc4.NewCipher`) has well-known keystream biases and is forbidden by RFC
7465. For OAuth/OIDC this means tokens, client secrets, and other
sensitive material are not adequately protected and may be recovered by
an attacker.

Use authenticated AES instead: load the key with `crypto/aes`
(`aes.NewCipher(key)`) and wrap it in `cipher.NewGCM(block)` to get
AES-GCM, which provides both confidentiality and integrity.

## ❌ Vulnerable

```go
package main

import (
	"crypto/cipher"
	"crypto/des"
	"crypto/rc4"
)

// DES is a broken 64-bit block cipher.
func desCipher(key []byte) (cipher.Block, error) {
	// ruleid: auth.go.crypto.weak-cipher
	return des.NewCipher(key)
}

// 3DES is deprecated (Sweet32, 64-bit block).
func tripleDESCipher(key []byte) (cipher.Block, error) {
	// ruleid: auth.go.crypto.weak-cipher
	return des.NewTripleDESCipher(key)
}

// RC4 has well-known keystream biases and is forbidden by RFC 7465.
func rc4Cipher(key []byte) (*rc4.Cipher, error) {
	// ruleid: auth.go.crypto.weak-cipher
	return rc4.NewCipher(key)
}
```

## ✅ Safe

```go
package main

import (
	"crypto/aes"
	"crypto/cipher"
)

// ok: auth.go.crypto.weak-cipher -- AES-GCM provides authenticated encryption
func aesGCM(key []byte) (cipher.AEAD, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

// ok: auth.go.crypto.weak-cipher -- plain AES block cipher is not flagged
func aesBlock(key []byte) (cipher.Block, error) {
	return aes.NewCipher(key)
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.crypto.weak-cipher -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/crypto/aes#NewCipher
- https://pkg.go.dev/crypto/cipher#NewGCM
- https://cwe.mitre.org/data/definitions/327.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
