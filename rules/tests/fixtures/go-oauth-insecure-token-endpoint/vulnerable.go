package main

import (
	"net/http"

	"golang.org/x/oauth2"
)

// oauth2.Endpoint configured with cleartext authorize/token URLs.
func insecureConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     "client",
		ClientSecret: "secret",
		// ruleid: auth.go.oauth.insecure-token-endpoint
		Endpoint: oauth2.Endpoint{
			AuthURL: "http://issuer.example.com/oauth/authorize",
			// ruleid: auth.go.oauth.insecure-token-endpoint
			TokenURL: "http://issuer.example.com/oauth/token",
		},
	}
}

// A hand-built authorize URL over http with OAuth query markers.
func insecureAuthorizeURL() string {
	// ruleid: auth.go.oauth.insecure-token-endpoint
	return "http://issuer.example.com/auth?response_type=code&client_id=app"
}

// A token request issued to a cleartext /connect/token endpoint.
func insecureTokenRequest() (*http.Response, error) {
	// ruleid: auth.go.oauth.insecure-token-endpoint
	return http.Post("http://issuer.example.com/connect/token", "application/x-www-form-urlencoded", nil)
}

func main() {}
