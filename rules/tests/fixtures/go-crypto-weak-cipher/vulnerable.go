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
