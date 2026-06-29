package main

import (
	"crypto/rand"
	"encoding/base64"

	"golang.org/x/oauth2"
)

// randomState returns a fresh CSPRNG-backed state value.
func randomState() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// Safe: a per-request random state generated from crypto/rand.
func authorizeRandom(conf *oauth2.Config) string {
	state := randomState()
	// ok: auth.go.oauth.static-state
	return conf.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// Safe trap: the empty-string form is a missing state (covered elsewhere),
// not a hardcoded literal, and must not be flagged by this rule.
func authorizeEmpty(conf *oauth2.Config) string {
	// ok: auth.go.oauth.static-state
	return conf.AuthCodeURL("")
}

func main() {}
