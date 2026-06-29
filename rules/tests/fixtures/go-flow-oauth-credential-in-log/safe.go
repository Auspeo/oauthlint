package main

import (
	"log"
	"net/http"
)

// redact replaces all but the first few characters of a secret.
func redact(s string) string {
	if len(s) <= 4 {
		return "****"
	}
	return s[:4] + "****"
}

// Safe: the credential is masked before it reaches the log sink.
func logRedacted(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.oauth-credential-in-log
	log.Printf("code=%s", redact(r.URL.Query().Get("code")))
}

// Safe trap: a benign, non-credential request field logged verbatim must not
// fire — the source list is scoped to OAuth credential names only.
func logPage(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.oauth-credential-in-log
	log.Printf("page=%s", r.URL.Query().Get("page"))
}

func main() {
	http.HandleFunc("/r", logRedacted)
	http.HandleFunc("/p", logPage)
	_ = http.ListenAndServe(":8080", nil)
}
