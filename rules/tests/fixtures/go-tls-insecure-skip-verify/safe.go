package main

import (
	"crypto/tls"
	"crypto/x509"
)

// ok: auth.go.tls.insecure-skip-verify -- verification left on (default)
func goodDefault() *tls.Config {
	return &tls.Config{MinVersion: tls.VersionTLS12}
}

// ok: auth.go.tls.insecure-skip-verify -- explicitly false
func explicitFalse() *tls.Config {
	return &tls.Config{InsecureSkipVerify: false}
}

// ok: auth.go.tls.insecure-skip-verify -- private CA via RootCAs, not skipping
func privateCA(pool *x509.CertPool) *tls.Config {
	return &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}
}
