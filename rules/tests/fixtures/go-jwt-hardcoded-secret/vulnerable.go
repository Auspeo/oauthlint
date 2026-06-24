package main

import (
	"github.com/golang-jwt/jwt/v5"
)

func signWithLiteral() (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	// ruleid: auth.go.jwt.hardcoded-secret
	return token.SignedString([]byte("super-secret-signing-key"))
}

func parseWithLiteralKeyfunc(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		// ruleid: auth.go.jwt.hardcoded-secret
		return []byte("super-secret-signing-key"), nil
	})
}
