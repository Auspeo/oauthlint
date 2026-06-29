package main

import (
	"net/http"

	"golang.org/x/oauth2"
)

// Safe: every OAuth endpoint uses https://.
func secureConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID: "client",
		// ok: auth.go.oauth.insecure-token-endpoint
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://issuer.example.com/oauth/authorize",
			TokenURL: "https://issuer.example.com/oauth/token",
		},
	}
}

// Safe: localhost over http is allowed for local development.
func localDevToken() (*http.Response, error) {
	// ok: auth.go.oauth.insecure-token-endpoint
	return http.Post("http://localhost:8080/oauth/token", "application/x-www-form-urlencoded", nil)
}

// Safe trap: a generic cleartext http URL with no OAuth marker is not an
// OAuth endpoint and must not be flagged.
func fetchHealth() (*http.Response, error) {
	// ok: auth.go.oauth.insecure-token-endpoint
	return http.Get("http://issuer.example.com/healthz")
}

func main() {}
