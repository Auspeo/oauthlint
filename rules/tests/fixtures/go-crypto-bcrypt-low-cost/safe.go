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
