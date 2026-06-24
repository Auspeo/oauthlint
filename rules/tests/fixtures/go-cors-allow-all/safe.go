package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	rscors "github.com/rs/cors"
)

// ok: auth.go.cors.allow-all -- gin-contrib explicit allowlist, not AllowAllOrigins
func ginAllowlist() cors.Config {
	return cors.Config{
		AllowOrigins: []string{"https://app.example.com"},
		AllowMethods: []string{"GET", "POST"},
	}
}

// ok: auth.go.cors.allow-all -- rs/cors explicit allowlist, no wildcard
func rsAllowlist() *rscors.Cors {
	return rscors.New(rscors.Options{
		AllowedOrigins: []string{"https://app.example.com"},
		AllowedMethods: []string{"GET", "POST"},
	})
}

// ok: auth.go.cors.allow-all -- raw header set to an explicit trusted origin
func rawHeaderAllowlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "https://app.example.com")
	w.WriteHeader(http.StatusOK)
}
