package main

import (
	"github.com/golang-jwt/jwt/v5"
)

// Case 1: signing a token with the `none` method via NewWithClaims.
func signNone() *jwt.Token {
	// ruleid: auth.go.jwt.none-algorithm
	return jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"sub": "1234567890",
	})
}

// Case 2: passing the UnsafeAllowNoneSignatureType sentinel to SignedString.
func signWithUnsafeSentinel(token *jwt.Token) (string, error) {
	// ruleid: auth.go.jwt.none-algorithm
	return token.SignedString(jwt.UnsafeAllowNoneSignatureType)
}

// Case 3: building a token with the none method via jwt.New.
func newNone() *jwt.Token {
	// ruleid: auth.go.jwt.none-algorithm
	return jwt.New(jwt.SigningMethodNone)
}
