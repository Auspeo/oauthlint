package main

import (
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
)

// ruleid: auth.go.session.hardcoded-secret
var cookieStore = sessions.NewCookieStore([]byte("super-secret-signing-key-123"))

// ruleid: auth.go.session.hardcoded-secret
var fsStore = sessions.NewFilesystemStore("/tmp/sessions", []byte("another-hardcoded-key-456"))

// ruleid: auth.go.session.hardcoded-secret
var sc = securecookie.New([]byte("hash-key-hardcoded-literal"), []byte("block-key-hardcoded"))
