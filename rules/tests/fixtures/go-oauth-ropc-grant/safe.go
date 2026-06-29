package main

import (
	"context"
	"net/http"
	"net/url"
	"strings"

	"golang.org/x/oauth2"
)

// Safe: authorization-code exchange — the recommended user-login flow.
func loginAuthCode(conf *oauth2.Config, code string) (*oauth2.Token, error) {
	// ok: auth.go.oauth.ropc-grant
	return conf.Exchange(context.Background(), code)
}

// Safe: client-credentials grant for machine-to-machine — not the password
// grant. A `grant_type` field carrying a different value must not match.
func loginClientCreds() (*http.Response, error) {
	v := url.Values{}
	// ok: auth.go.oauth.ropc-grant
	v.Set("grant_type", "client_credentials")
	v.Set("client_id", "svc")
	return http.PostForm("https://issuer.example.com/oauth/token", v)
}

// Safe trap: a password-reset endpoint whose grant_type prefix-matches
// "password" but is a distinct, bounded value.
func resetPassword() (*http.Response, error) {
	// ok: auth.go.oauth.ropc-grant
	body := "grant_type=password_reset&email=user@example.com"
	return http.Post("https://issuer.example.com/reset", "application/x-www-form-urlencoded", strings.NewReader(body))
}

func main() {}
