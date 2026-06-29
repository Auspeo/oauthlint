package main

import (
	"context"
	"net/http"
	"net/url"
	"strings"

	"golang.org/x/oauth2"
)

// golang.org/x/oauth2 ROPC helper — the password grant.
func loginOAuth2(conf *oauth2.Config, username, password string) (*oauth2.Token, error) {
	// ruleid: auth.go.oauth.ropc-grant
	return conf.PasswordCredentialsToken(context.Background(), username, password)
}

// Hand-rolled token request via url.Values builder.
func loginForm(username, password string) (*http.Response, error) {
	v := url.Values{}
	v.Set("grant_type", "password")
	v.Set("username", username)
	v.Set("password", password)
	// ruleid: auth.go.oauth.ropc-grant
	return http.PostForm("https://issuer.example.com/oauth/token", v)
}

// url.Values composite literal carrying the password grant.
func loginLiteral(username, password string) (*http.Response, error) {
	// ruleid: auth.go.oauth.ropc-grant
	v := url.Values{"grant_type": {"password"}, "username": {username}, "password": {password}}
	return http.PostForm("https://issuer.example.com/oauth/token", v)
}

// URL-encoded body string built by hand.
func loginRawBody(username, password string) (*http.Request, error) {
	// ruleid: auth.go.oauth.ropc-grant
	body := "grant_type=password&username=" + username + "&password=" + password
	return http.NewRequest("POST", "https://issuer.example.com/oauth/token", strings.NewReader(body))
}

func main() {}
