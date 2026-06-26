package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

func keyFunc(token *jwt.Token) (interface{}, error) {
	return []byte("secret"), nil
}

// jwt.Parse with default claims validation enabled — expiry is checked.
func parseDefault(tokenStr string) string {
	// ok: auth.go.jwt.skip-claims-validation
	parsed, err := jwt.Parse(tokenStr, keyFunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// jwt.ParseWithClaims with default claims validation enabled.
func parseWithClaimsDefault(tokenStr string) string {
	claims := jwt.MapClaims{}
	// ok: auth.go.jwt.skip-claims-validation
	parsed, err := jwt.ParseWithClaims(tokenStr, claims, keyFunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}

// A parser configured only with legitimate options keeps claims validation on.
func parserSafeOptions(tokenStr string) string {
	// ok: auth.go.jwt.skip-claims-validation
	parser := jwt.NewParser(jwt.WithValidMethods([]string{"RS256"}))
	parsed, err := parser.Parse(tokenStr, keyFunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}
