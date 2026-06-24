# `auth.go.cookie.insecure`

> A session/auth `http.Cookie` is created with a security attribute

| | |
|---|---|
| **OAuthLint id** | `AUTH-GO-COOKIE-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-614](https://cwe.mitre.org/data/definitions/614.html) |
| **OWASP** | A05:2021 |
| **Languages** | go |
| **Technologies** | net/http |

## Why this matters

A session/auth `http.Cookie` is created with a security attribute
explicitly disabled (`Secure: false` or `HttpOnly: false`). With
`Secure: false` the cookie is sent over plain HTTP, so a network
attacker can read the session token. With `HttpOnly: false` the cookie
is readable from JavaScript, so any XSS can steal it. For OAuth/OIDC
this exposes session and token cookies to theft and hijacking.

Set `Secure: true` and `HttpOnly: true` on auth cookies, and add an
appropriate `SameSite` mode (for example `SameSite: http.SameSiteLaxMode`).

## ❌ Vulnerable

```go
package main

import "net/http"

func insecureCookie() *http.Cookie {
	// ruleid: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc", Secure: false}
}

func nonHTTPOnlyCookie() *http.Cookie {
	// ruleid: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc", HttpOnly: false}
}

func setInsecureCookie(w http.ResponseWriter) {
	// ruleid: auth.go.cookie.insecure
	c := http.Cookie{Name: "auth", Value: "tok", Secure: false}
	http.SetCookie(w, &c)
}

func setNonHTTPOnlyCookie(w http.ResponseWriter) {
	// ruleid: auth.go.cookie.insecure
	http.SetCookie(w, &http.Cookie{Name: "auth", Value: "tok", HttpOnly: false})
}
```

## ✅ Safe

```go
package main

import "net/http"

func secureCookie() *http.Cookie {
	// ok: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc", Secure: true, HttpOnly: true, SameSite: http.SameSiteLaxMode}
}

func defaultCookie() *http.Cookie {
	// ok: auth.go.cookie.insecure
	return &http.Cookie{Name: "session", Value: "abc"}
}

func setSecureCookie(w http.ResponseWriter) {
	// ok: auth.go.cookie.insecure
	http.SetCookie(w, &http.Cookie{Name: "auth", Value: "tok", Secure: true, HttpOnly: true})
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.go.cookie.insecure -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pkg.go.dev/net/http#Cookie
- https://cwe.mitre.org/data/definitions/614.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
