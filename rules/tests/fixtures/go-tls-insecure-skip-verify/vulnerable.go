package main

import (
	"crypto/tls"
	"net/http"
)

func badClient() *http.Client {
	// ruleid: auth.go.tls.insecure-skip-verify
	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	return &http.Client{Transport: tr}
}

func badConfig() *tls.Config {
	// ruleid: auth.go.tls.insecure-skip-verify
	return &tls.Config{MinVersion: tls.VersionTLS12, InsecureSkipVerify: true}
}
