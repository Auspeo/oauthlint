package main

import (
	"github.com/golang-jwt/jwt/v5"
)

// ok: auth.go.jwt.none-algorithm
func signHS256(secret []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	return token.SignedString([]byte(secret))
}

// ok: auth.go.jwt.none-algorithm
func signRS256(token *jwt.Token, key interface{}) (string, error) {
	token = jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"sub": "abc",
	})
	return token.SignedString(key)
}

// ok: auth.go.jwt.none-algorithm
func signES256(key interface{}) jwt.SigningMethod {
	return jwt.SigningMethodES256
}

// ok: auth.go.jwt.none-algorithm -- defensively REJECTING none is not a misuse
func rejectNone(token *jwt.Token) error {
	if token.Method == jwt.SigningMethodNone {
		return jwt.ErrTokenUnverifiable
	}
	return nil
}
