---
'oauthlint-rules': minor
---

Add `auth.go.cors.allow-all` (AUTH-GO-CORS-001, CWE-942). Flags Go CORS
configurations that allow every origin via the wildcard `*`: gin-contrib/cors
`cors.Config{..., AllowAllOrigins: true, ...}`, rs/cors `cors.Options{...,
AllowedOrigins: []string{"*"}, ...}` (any list literal containing `"*"`), and
the raw header `w.Header().Set("Access-Control-Allow-Origin", "*")`. Allowing
all origins defeats the same-origin policy and, combined with credentials,
becomes an account-takeover primitive that leaks OAuth/OIDC tokens. Only the
wildcard / `AllowAllOrigins: true` is matched — explicit origins such as
`"https://app.example.com"` are not flagged.
