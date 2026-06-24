package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Decodes the token without verifying its signature, then trusts the claims.
func subjectFromParser(tok string) string {
	parser := jwt.NewParser()
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.parse-unverified
	parser.ParseUnverified(tok, claims)
	return fmt.Sprintf("%v", claims["sub"])
}

// Inline parser construction, same unsafe path.
func subjectInline(tok string) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.parse-unverified
	jwt.NewParser().ParseUnverified(tok, claims)
	return fmt.Sprintf("%v", claims["sub"])
}

// new(jwt.Parser) receiver.
func subjectNewParser(tok string) string {
	claims := jwt.MapClaims{}
	// ruleid: auth.go.jwt.parse-unverified
	new(jwt.Parser).ParseUnverified(tok, claims)
	return fmt.Sprintf("%v", claims["sub"])
}
