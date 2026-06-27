package main

import (
	"net/http"
	"os"
)

// redact masks a secret before it is allowed anywhere near a response,
// clearing the taint.
func redact(s string) string {
	if len(s) == 0 {
		return ""
	}
	return "****"
}

// Safe: a client-public URL carries no secret — the PUBLIC_ prefix is excluded.
func writePublicURL(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.secret-in-response
	w.Write([]byte(os.Getenv("PUBLIC_URL")))
}

// Safe: a NEXT_PUBLIC_-prefixed value is client-public by design even though
// its name contains "API_KEY" — the negative lookahead excludes it.
func writeNextPublic(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.secret-in-response
	w.Write([]byte(os.Getenv("NEXT_PUBLIC_API_KEY")))
}

// Safe: a non-secret operational value (the listen port) is not a credential.
func writePort(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.secret-in-response
	w.Write([]byte(os.Getenv("PORT")))
}

// Safe: a hard-coded constant, never a secret.
func writeConstant(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.secret-in-response
	w.Write([]byte("service is healthy"))
}

// Safe: the secret is redacted before it reaches the response — the sanitizer
// clears the taint.
func writeRedacted(w http.ResponseWriter, r *http.Request) {
	masked := redact(os.Getenv("CLIENT_SECRET"))
	// ok: auth.go.flow.secret-in-response
	w.Write([]byte(masked))
}

func main() {
	http.HandleFunc("/a", writePublicURL)
	http.HandleFunc("/b", writeNextPublic)
	http.HandleFunc("/c", writePort)
	http.HandleFunc("/d", writeConstant)
	http.HandleFunc("/e", writeRedacted)
	_ = http.ListenAndServe(":8080", nil)
}
