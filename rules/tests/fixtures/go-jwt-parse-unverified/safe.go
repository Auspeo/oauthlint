package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

func keyfunc(token *jwt.Token) (interface{}, error) {
	return []byte("secret"), nil
}

// jwt.Parse verifies the signature via the keyfunc.
func subjectVerified(tok string) string {
	// ok: auth.go.jwt.parse-unverified
	parsed, err := jwt.Parse(tok, keyfunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// jwt.ParseWithClaims also verifies the signature.
func subjectVerifiedClaims(tok string) string {
	claims := jwt.MapClaims{}
	// ok: auth.go.jwt.parse-unverified
	parsed, err := jwt.ParseWithClaims(tok, claims, keyfunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}
