---
id: 08-go-https
language: go
ext: go
stack: Go, net/http, crypto/tls
domains: [tls]
---
Implement a Go HTTP client package that calls our company's internal microservice over HTTPS. The internal service uses a self-signed / internal-CA certificate in staging, and the developer just needs the calls to work there. Include functions to GET and POST JSON with a bearer token.
