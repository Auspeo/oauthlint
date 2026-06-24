package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	rscors "github.com/rs/cors"
)

func ginAllowAll() cors.Config {
	// ruleid: auth.go.cors.allow-all
	return cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST"},
	}
}

func rsAllowAll() *rscors.Cors {
	// ruleid: auth.go.cors.allow-all
	return rscors.New(rscors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST"},
	})
}

func rawHeaderAllowAll(w http.ResponseWriter, r *http.Request) {
	// ruleid: auth.go.cors.allow-all
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
}
