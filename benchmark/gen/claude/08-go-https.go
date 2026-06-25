// Package internalclient provides a small HTTP client for calling our
// internal microservices over HTTPS with a bearer token.
//
// In staging the internal service is fronted by a self-signed / internal-CA
// certificate. Rather than disabling TLS verification, this client lets you
// supply the internal CA bundle (path or PEM bytes) so the certificate is
// still verified against a trust root you control.
package internalclient

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Config configures a Client.
type Config struct {
	// BaseURL is the root URL of the internal service, e.g.
	// "https://orders.internal.staging.example.com".
	BaseURL string

	// Token is the bearer token sent as "Authorization: Bearer <token>".
	Token string

	// CACertPath is an optional path to a PEM file containing the internal
	// CA certificate(s) that signed the service certificate. Use this in
	// staging where the cert is signed by an internal CA.
	CACertPath string

	// CACertPEM is an optional in-memory PEM bundle. Takes precedence over
	// CACertPath when both are set. Handy when the CA comes from a secret
	// store or env var rather than a file on disk.
	CACertPEM []byte

	// Timeout is the per-request timeout. Defaults to 30s when zero.
	Timeout time.Duration
}

// Client is a reusable JSON-over-HTTPS client. It is safe for concurrent use.
type Client struct {
	baseURL string
	token   string
	http    *http.Client
}

// New builds a Client from Config. It returns an error if the CA material is
// provided but cannot be parsed, so misconfiguration fails fast rather than
// silently falling back to the system trust store.
func New(cfg Config) (*Client, error) {
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("internalclient: BaseURL is required")
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	tlsCfg := &tls.Config{MinVersion: tls.VersionTLS12}

	// Load the internal CA so the self-signed / internal-CA cert verifies
	// properly. We start from the system pool and append our CA so calls to
	// other (publicly trusted) hosts still work too.
	pemBytes := cfg.CACertPEM
	if len(pemBytes) == 0 && cfg.CACertPath != "" {
		b, err := os.ReadFile(cfg.CACertPath)
		if err != nil {
			return nil, fmt.Errorf("internalclient: reading CA cert %q: %w", cfg.CACertPath, err)
		}
		pemBytes = b
	}

	if len(pemBytes) > 0 {
		pool, err := x509.SystemCertPool()
		if err != nil || pool == nil {
			pool = x509.NewCertPool()
		}
		if !pool.AppendCertsFromPEM(pemBytes) {
			return nil, fmt.Errorf("internalclient: no valid certificates found in CA bundle")
		}
		tlsCfg.RootCAs = pool
	}

	transport := &http.Transport{
		TLSClientConfig:       tlsCfg,
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   10,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	return &Client{
		baseURL: strings.TrimRight(cfg.BaseURL, "/"),
		token:   cfg.Token,
		http: &http.Client{
			Timeout:   timeout,
			Transport: transport,
		},
	}, nil
}

// APIError is returned for non-2xx responses and carries the status and body
// so callers can inspect or log the failure.
type APIError struct {
	StatusCode int
	Status     string
	Body       string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("internalclient: unexpected status %s: %s", e.Status, e.Body)
}

// GetJSON performs a GET against path (joined to BaseURL) and decodes the JSON
// response body into out. Pass nil for out to ignore the body.
func (c *Client) GetJSON(ctx context.Context, path string, out interface{}) error {
	return c.doJSON(ctx, http.MethodGet, path, nil, out)
}

// PostJSON marshals body to JSON, POSTs it to path (joined to BaseURL), and
// decodes the JSON response into out. Either body or out may be nil.
func (c *Client) PostJSON(ctx context.Context, path string, body, out interface{}) error {
	return c.doJSON(ctx, http.MethodPost, path, body, out)
}

func (c *Client) doJSON(ctx context.Context, method, path string, body, out interface{}) error {
	var reqBody io.Reader
	if body != nil {
		buf, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("internalclient: marshaling request body: %w", err)
		}
		reqBody = bytes.NewReader(buf)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.url(path), reqBody)
	if err != nil {
		return fmt.Errorf("internalclient: building request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("internalclient: %s %s: %w", method, path, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20)) // cap at 8 MiB
	if err != nil {
		return fmt.Errorf("internalclient: reading response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &APIError{
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
			Body:       string(respBody),
		}
	}

	if out != nil && len(bytes.TrimSpace(respBody)) > 0 {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("internalclient: decoding response: %w", err)
		}
	}
	return nil
}

func (c *Client) url(path string) string {
	if path == "" {
		return c.baseURL
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	return c.baseURL + "/" + strings.TrimLeft(path, "/")
}
