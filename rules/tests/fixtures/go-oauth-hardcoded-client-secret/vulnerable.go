package main

import "golang.org/x/oauth2"

// ruleid: auth.go.oauth.hardcoded-client-secret
var conf = &oauth2.Config{
	ClientID:     "my-client-id",
	ClientSecret: "s3cr3t-hardcoded-client-secret",
	RedirectURL:  "https://app.example.com/callback",
}
