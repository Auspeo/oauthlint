package main

import (
	"os"

	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
)

// Keys loaded from the environment / a secret manager are not flagged.
var cookieStore = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))

var hashKey = []byte(os.Getenv("SC_HASH_KEY"))
var blockKey = []byte(os.Getenv("SC_BLOCK_KEY"))
var sc = securecookie.New(hashKey, blockKey)

// Obvious placeholder is dropped by the allow-list.
var demo = sessions.NewCookieStore([]byte("changeme"))
