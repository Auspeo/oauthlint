package main

import "net/http"

func insecureCookie() *http.Cookie {
	// ruleid: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc", Secure: false}
}

func nonHTTPOnlyCookie() *http.Cookie {
	// ruleid: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc", HttpOnly: false}
}

func setInsecureCookie(w http.ResponseWriter) {
	// ruleid: auth.go.cookie.insecure
	c := http.Cookie{Name: "auth", Value: "tok", Secure: false}
	http.SetCookie(w, &c)
}

func setNonHTTPOnlyCookie(w http.ResponseWriter) {
	// ruleid: auth.go.cookie.insecure
	http.SetCookie(w, &http.Cookie{Name: "auth", Value: "tok", HttpOnly: false})
}
