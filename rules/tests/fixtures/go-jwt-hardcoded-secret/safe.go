package main

import (
	"os"

	"github.com/golang-jwt/jwt/v5"
)

func signFromEnv() (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	// ok: auth.go.jwt.hardcoded-secret
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func signFromVar(secret []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1234567890",
	})
	// ok: auth.go.jwt.hardcoded-secret
	return token.SignedString(secret)
}

func parseFromEnvKeyfunc(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		// ok: auth.go.jwt.hardcoded-secret
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
}
