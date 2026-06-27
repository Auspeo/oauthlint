package main

import (
	"net/http"
	"net/url"
	"strings"
)

// Allow-list of hosts this service is permitted to call.
var allowedHosts = map[string]bool{
	"api.internal.example.com": true,
	"images.example.com":       true,
}

// isAllowedHost vets a raw URL string against the allow-list, returning the
// vetted URL or a safe default, clearing the taint.
func isAllowedHost(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || !allowedHosts[strings.ToLower(u.Host)] {
		return "https://api.internal.example.com/health"
	}
	return raw
}

// Safe: request a hard-coded constant URL — no untrusted input.
func fetchConstant(w http.ResponseWriter, r *http.Request) {
	// ok: auth.go.flow.ssrf
	resp, _ := http.Get("https://api.internal.example.com/health")
	defer resp.Body.Close()
}

// Safe: the request value is passed through a host allow-list validator that
// clears the taint before it reaches the sink.
func fetchValidated(w http.ResponseWriter, r *http.Request) {
	target := isAllowedHost(r.URL.Query().Get("url"))
	// ok: auth.go.flow.ssrf
	resp, _ := http.Get(target)
	defer resp.Body.Close()
}

func main() {
	http.HandleFunc("/c", fetchConstant)
	http.HandleFunc("/v", fetchValidated)
	_ = http.ListenAndServe(":8080", nil)
}
