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
