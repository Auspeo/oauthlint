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
