package main

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

// The HMAC secret is taken from a request query parameter and returned as the
// verification key — the attacker signs their own token with a key they choose.
func verifyQueryKey(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	// ruleid: auth.go.jwt.untrusted-verify-key
	_, _ = jwt.Parse(r.FormValue("token"), func(t *jwt.Token) (interface{}, error) {
		return []byte(key), nil
	})
}

// The accepted signing methods come from a request header.
func verifyUntrustedMethods(w http.ResponseWriter, r *http.Request) {
	alg := r.Header.Get("X-Alg")
	// ruleid: auth.go.jwt.untrusted-verify-key
	parser := jwt.NewParser(jwt.WithValidMethods([]string{alg}))
	_, _ = parser.Parse(r.FormValue("token"), func(t *jwt.Token) (interface{}, error) {
		return []byte("server-secret"), nil
	})
}

func main() {
	http.HandleFunc("/v", verifyQueryKey)
	http.HandleFunc("/m", verifyUntrustedMethods)
	_ = http.ListenAndServe(":8080", nil)
}
