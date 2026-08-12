package main

import "golang.org/x/oauth2"

func authURLs(conf *oauth2.Config, state string) {
	// ruleid: auth.go.oauth.no-pkce
	_ = conf.AuthCodeURL(state)

	// ruleid: auth.go.oauth.no-pkce
	_ = conf.AuthCodeURL(state, oauth2.AccessTypeOffline)
}
