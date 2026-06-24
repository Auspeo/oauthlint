package main

import (
	"crypto/tls"
	"net/http"
)

func tls12Client() *http.Client {
	// ok: auth.go.tls.min-version
	tr := &http.Transport{TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12}}
	return &http.Client{Transport: tr}
}

func tls13Config() *tls.Config {
	// ok: auth.go.tls.min-version
	return &tls.Config{MinVersion: tls.VersionTLS13}
}

func defaultConfig() *tls.Config {
	// ok: auth.go.tls.min-version
	return &tls.Config{}
}
