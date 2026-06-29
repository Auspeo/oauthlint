package main

import (
	"net/http"
	"net/url"
)

// Inline: a query parameter flows straight into http.Get.
func fetchQuery(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.flow.ssrf
	resp, _ := http.Get(r.URL.Query().Get("url"))
	defer resp.Body.Close()
}

// Indirection: form value assigned to a local, then requested.
func fetchForm(w http.ResponseWriter, r *http.Request) {
	target := r.FormValue("endpoint")
	// ruleid: auth.go.flow.ssrf
	resp, _ := http.Get(target)
	defer resp.Body.Close()
}

// http.Post with an untrusted URL argument.
func postForm(w http.ResponseWriter, r *http.Request) {
	dest := r.PostFormValue("callback")
	// ruleid: auth.go.flow.ssrf
	resp, _ := http.Post(dest, "application/json", nil)
	defer resp.Body.Close()
}

// http.Head against a header-derived URL.
func headHeader(w http.ResponseWriter, r *http.Request) {
	loc := r.Header.Get("X-Fetch-From")
	// ruleid: auth.go.flow.ssrf
	resp, _ := http.Head(loc)
	defer resp.Body.Close()
}

// http.NewRequest with the URL coming from a query parameter.
func buildRequest(w http.ResponseWriter, r *http.Request) {
	u := r.URL.Query().Get("target")
	// ruleid: auth.go.flow.ssrf
	req, _ := http.NewRequest("GET", u, nil)
	_ = req
}

// http.NewRequestWithContext with an untrusted URL.
func buildRequestCtx(w http.ResponseWriter, r *http.Request) {
	u := r.FormValue("uri")
	// ruleid: auth.go.flow.ssrf
	req, _ := http.NewRequestWithContext(r.Context(), "POST", u, nil)
	_ = req
}

// Custom client Get with a tainted URL.
func clientGet(w http.ResponseWriter, r *http.Request) {
	client := &http.Client{}
	u := r.URL.Query().Get("addr")
	// ruleid: auth.go.flow.ssrf
	resp, _ := client.Get(u)
	defer resp.Body.Close()
}

// Custom client Post with a tainted URL.
func clientPost(w http.ResponseWriter, r *http.Request) {
	client := &http.Client{}
	u := r.Header.Get("X-Upstream")
	// ruleid: auth.go.flow.ssrf
	resp, _ := client.Post(u, "text/plain", nil)
	defer resp.Body.Close()
}

// Parse-then-use without a host check: url.Parse does not validate anything,
// so the parsed result is still attacker-controlled — a real SSRF.
func fetchParsedUnchecked(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("url")
	u, _ := url.Parse(raw)
	// ruleid: auth.go.flow.ssrf
	resp, _ := http.Get(u.String())
	defer resp.Body.Close()
}

func main() {
	http.HandleFunc("/q", fetchQuery)
	http.HandleFunc("/pu", fetchParsedUnchecked)
	http.HandleFunc("/f", fetchForm)
	http.HandleFunc("/p", postForm)
	http.HandleFunc("/h", headHeader)
	http.HandleFunc("/nr", buildRequest)
	http.HandleFunc("/nrc", buildRequestCtx)
	http.HandleFunc("/cg", clientGet)
	http.HandleFunc("/cp", clientPost)
	_ = http.ListenAndServe(":8080", nil)
}
