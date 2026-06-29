package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
)

// Inline: the authorization code logged straight from the query string.
func logCode(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.flow.oauth-credential-in-log
	log.Printf("received code=%s", r.URL.Query().Get("code"))
}

// Indirection: access token stored in a local, then logged via slog.
func logAccessToken(w http.ResponseWriter, r *http.Request) {
	at := r.FormValue("access_token")
	// ruleid: auth.go.flow.oauth-credential-in-log
	slog.Info("token exchange", "token", at)
}

// The raw Authorization header written to stdout via fmt.
func logAuthHeader(w http.ResponseWriter, r *http.Request) {
	auth := r.Header.Get("Authorization")
	// ruleid: auth.go.flow.oauth-credential-in-log
	fmt.Println("auth:", auth)
}

// A client_secret form value logged through a named logger receiver.
func logClientSecret(w http.ResponseWriter, r *http.Request, logger *log.Logger) {
	// ruleid: auth.go.flow.oauth-credential-in-log
	logger.Printf("client_secret=%s", r.PostFormValue("client_secret"))
}

func main() {
	http.HandleFunc("/code", logCode)
	http.HandleFunc("/at", logAccessToken)
	_ = http.ListenAndServe(":8080", nil)
}
