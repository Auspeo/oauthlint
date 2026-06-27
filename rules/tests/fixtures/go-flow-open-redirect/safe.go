package main

import (
	"net/http"
)

// Allow-list of known-safe relative destinations.
var allowedRedirects = map[string]bool{
	"/home":      true,
	"/dashboard": true,
}

// validateRedirect returns a vetted destination or a safe default.
func validateRedirect(dest string) string {
	if allowedRedirects[dest] {
		return dest
	}
	return "/home"
}

// Safe: redirect to a hard-coded constant path — no untrusted input.
func redirectConstant(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.open-redirect
	http.Redirect(w, r, "/home", http.StatusFound)
}

// Safe: the request value is passed through an allow-list validator that
// clears the taint before it reaches the sink.
func redirectValidated(w http.ResponseWriter, r *http.Request) {
	dest := validateRedirect(r.URL.Query().Get("next"))
	// ok: auth.go.flow.open-redirect
	http.Redirect(w, r, dest, http.StatusFound)
}

func main() {
	http.HandleFunc("/c", redirectConstant)
	http.HandleFunc("/v", redirectValidated)
	_ = http.ListenAndServe(":8080", nil)
}
