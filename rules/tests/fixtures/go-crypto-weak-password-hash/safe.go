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
