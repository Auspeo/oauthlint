package main

import (
	"crypto/tls"
	"net/http"
)

func tls10Client() *http.Client {
	// ruleid: auth.go.tls.min-version
	tr := &http.Transport{TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS10}}
	return &http.Client{Transport: tr}
}

func tls11Config() *tls.Config {
	// ruleid: auth.go.tls.min-version
	return &tls.Config{MinVersion: tls.VersionTLS11}
}

func ssl30Config() tls.Config {
	// ruleid: auth.go.tls.min-version
	return tls.Config{MinVersion: tls.VersionSSL30}
}
