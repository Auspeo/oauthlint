package main

import "net/http"

func secureCookie() *http.Cookie {
	// ok: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc", Secure: true, HttpOnly: true, SameSite: http.SameSiteLaxMode}
}

func defaultCookie() *http.Cookie {
	// ok: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc"}
}

func setSecureCookie(w http.ResponseWriter) {
	// ok: auth.go.cookie.insecure
	http.SetCookie(w, &http.Cookie{Name: "auth", Value: "tok", Secure: true, HttpOnly: true})
}
