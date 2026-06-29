package main

import (
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// Safe: the verification key comes from server configuration, and the token
// (the only request-derived value) is correctly the parsed argument, not the
// key. The token being request-controlled must NOT trigger the rule.
func verifyConfigKey(w http.ResponseWriter, r *http.Request) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	// ok: auth.go.jwt.untrusted-verify-key
	_, _ = jwt.Parse(r.FormValue("token"), func(t *jwt.Token) (interface{}, error) {
		return secret, nil
	})
}

// Safe: the accepted methods are a fixed server-side allowlist.
func verifyPinnedMethods(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.jwt.untrusted-verify-key
	parser := jwt.NewParser(jwt.WithValidMethods([]string{"RS256"}))
	_, _ = parser.Parse(r.FormValue("token"), func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
}

func main() {
	http.HandleFunc("/c", verifyConfigKey)
	http.HandleFunc("/p", verifyPinnedMethods)
	_ = http.ListenAndServe(":8080", nil)
}
