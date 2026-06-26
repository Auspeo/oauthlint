package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

func keyFunc(token *jwt.Token) (interface{}, error) {
	return []byte("secret"), nil
}

// Case 1: jwt.Parse with claims validation disabled — expired tokens parse.
func parseNoClaimsValidation(tokenStr string) string {
	// ruleid: auth.go.jwt.skip-claims-validation
	parsed, err := jwt.Parse(tokenStr, keyFunc, jwt.WithoutClaimsValidation())
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// Case 2: jwt.ParseWithClaims with claims validation disabled.
func parseWithClaimsNoValidation(tokenStr string) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.skip-claims-validation
	parsed, err := jwt.ParseWithClaims(tokenStr, claims, keyFunc, jwt.WithoutClaimsValidation())
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}

// Case 3: a parser built with NewParser and claims validation disabled.
func parserNoClaimsValidation(tokenStr string) string {
	// ruleid: auth.go.jwt.skip-claims-validation
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	parsed, err := parser.Parse(tokenStr, keyFunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// Case 4: the option combined with other (legitimate) parser options still
// disables claims validation and is flagged.
func parserMixedOptions(tokenStr string) string {
	// ruleid: auth.go.jwt.skip-claims-validation
	parser := jwt.NewParser(jwt.WithValidMethods([]string{"RS256"}), jwt.WithoutClaimsValidation())
	parsed, err := parser.Parse(tokenStr, keyFunc)
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}
