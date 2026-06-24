package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Case 1: jwt.Parse with a keyfunc that returns the key WITHOUT checking
// token.Method. An attacker can sign with HS256 using the public RSA key.
func parseUnchecked(tok string, key interface{}) string {
	// ruleid: auth.go.jwt.unchecked-method
	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// Case 2: jwt.ParseWithClaims with the same unchecked keyfunc.
func parseWithClaimsUnchecked(tok string, key interface{}) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.unchecked-method
	parsed, err := jwt.ParseWithClaims(tok, claims, func(t *jwt.Token) (interface{}, error) {
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}
