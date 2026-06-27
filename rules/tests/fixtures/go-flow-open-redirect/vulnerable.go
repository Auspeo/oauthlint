package main

import (
	"net/http"
)

// Inline: a query parameter flows straight into http.Redirect.
func redirectQuery(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.flow.open-redirect
	http.Redirect(w, r, r.URL.Query().Get("next"), http.StatusFound)
}

// Indirection: form value assigned to a local, then redirected.
func redirectForm(w http.ResponseWriter, r *http.Request) {
	dest := r.FormValue("url")
	// ruleid: auth.go.flow.open-redirect
	http.Redirect(w, r, dest, http.StatusFound)
}

// Header-derived destination written to the Location header directly.
func redirectHeader(w http.ResponseWriter, r *http.Request) {
	target := r.Header.Get("X-Forward-To")
	// ruleid: auth.go.flow.open-redirect
	w.Header().Set("Location", target)
	w.WriteHeader(http.StatusFound)
}

// PostFormValue source flowing into a Location header.
func redirectPostForm(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.flow.open-redirect
	w.Header().Set("Location", r.PostFormValue("return_to"))
	w.WriteHeader(http.StatusSeeOther)
}

func main() {
	http.HandleFunc("/q", redirectQuery)
	http.HandleFunc("/f", redirectForm)
	http.HandleFunc("/h", redirectHeader)
	http.HandleFunc("/p", redirectPostForm)
	_ = http.ListenAndServe(":8080", nil)
}
