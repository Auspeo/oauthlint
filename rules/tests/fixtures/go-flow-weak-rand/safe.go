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
