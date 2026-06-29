package main

import (
	"golang.org/x/oauth2"
)

// Hardcoded state passed to AuthCodeURL — constant on every request.
func authorizeStatic(conf *oauth2.Config) string {
	// ruleid: auth.go.oauth.static-state
	return conf.AuthCodeURL("xyz123")
}

// Hardcoded state alongside extra AuthCodeOption arguments.
func authorizeStaticWithOpts(conf *oauth2.Config) string {
	// ruleid: auth.go.oauth.static-state
	return conf.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
}

func main() {}
