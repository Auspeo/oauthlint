package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// Inline: an API key read from the environment is written straight to the
// response body via ResponseWriter.Write.
func leakWrite(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.flow.secret-in-response
	w.Write([]byte(os.Getenv("API_KEY")))
}

// Indirection: a client secret assigned to a local, then printed to the
// response with fmt.Fprint.
func leakFprint(w http.ResponseWriter, r *http.Request) {
	secret := os.Getenv("CLIENT_SECRET")
	// ruleid: auth.go.flow.secret-in-response
	fmt.Fprint(w, secret)
}

// A bearer token interpolated into the response via fmt.Fprintf.
func leakFprintf(w http.ResponseWriter, r *http.Request) {
	token := os.Getenv("AUTH_TOKEN")
	// ruleid: auth.go.flow.secret-in-response
	fmt.Fprintf(w, "token=%s", token)
}

// A database password streamed to the response with io.WriteString.
func leakWriteString(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.flow.secret-in-response
	io.WriteString(w, os.Getenv("DB_PASSWORD"))
}

// An access key serialised into a JSON response.
func leakJSON(w http.ResponseWriter, r *http.Request) {
	creds := os.Getenv("ACCESS_KEY")
	// ruleid: auth.go.flow.secret-in-response
	json.NewEncoder(w).Encode(creds)
}

// os.LookupEnv source: a user password flows into the response.
func leakLookup(w http.ResponseWriter, r *http.Request) {
	pw, _ := os.LookupEnv("USER_PASSWORD")
	// ruleid: auth.go.flow.secret-in-response
	fmt.Fprint(w, pw)
}

func main() {
	http.HandleFunc("/a", leakWrite)
	http.HandleFunc("/b", leakFprint)
	http.HandleFunc("/c", leakFprintf)
	http.HandleFunc("/d", leakWriteString)
	http.HandleFunc("/e", leakJSON)
	http.HandleFunc("/f", leakLookup)
	_ = http.ListenAndServe(":8080", nil)
}
