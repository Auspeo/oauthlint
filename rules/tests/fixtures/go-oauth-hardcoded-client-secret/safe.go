package main

import (
	"os"

	"golang.org/x/oauth2"
)

// Secret from the environment: not a literal, not flagged.
var conf = &oauth2.Config{
	ClientID:     os.Getenv("OAUTH_CLIENT_ID"),
	ClientSecret: os.Getenv("OAUTH_CLIENT_SECRET"),
	RedirectURL:  "https://app.example.com/callback",
}

// Obvious placeholder dropped by the allow-list.
var demo = &oauth2.Config{
	ClientID:     "demo",
	ClientSecret: "your-client-secret",
}
