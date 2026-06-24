package main

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Keyfunc that verifies the signing method is HMAC before returning the key.
func parseChecked(tok string, key interface{}) string {
	// ok: auth.go.jwt.unchecked-method
	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}

// ParseWithClaims with a keyfunc that checks for RSA before returning the key.
func parseWithClaimsChecked(tok string, key interface{}) string {
	claims := jwt.MapClaims{}
	// ok: auth.go.jwt.unchecked-method
	parsed, err := jwt.ParseWithClaims(tok, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	return fmt.Sprintf("%v", claims["sub"])
}

// Keyfunc that checks token.Method via a direct comparison before returning.
func parseCheckedCompare(tok string, key interface{}) string {
	// ok: auth.go.jwt.unchecked-method
	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("bad alg")
		}
		return key, nil
	})
	if err != nil || !parsed.Valid {
		return ""
	}
	claims := parsed.Claims.(jwt.MapClaims)
	return fmt.Sprintf("%v", claims["sub"])
}
