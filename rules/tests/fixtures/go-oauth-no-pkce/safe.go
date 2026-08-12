package main

import "golang.org/x/oauth2"

func authURLsSafe(conf *oauth2.Config, state string) {
	verifier := oauth2.GenerateVerifier()

	// PKCE challenge present: not flagged.
	_ = conf.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))

	// PKCE plus extra options: not flagged.
	_ = conf.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.S256ChallengeOption(verifier))

	// Manual code_challenge param: not flagged.
	_ = conf.AuthCodeURL(state, oauth2.SetAuthURLParam("code_challenge", "abc"))

	// Hardcoded literal state is handled by auth.go.oauth.static-state, not here.
	_ = conf.AuthCodeURL("static-state", oauth2.S256ChallengeOption(verifier))
}
