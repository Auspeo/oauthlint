---
'oauthlint-rules': minor
---

Add `auth.cors.reflect-origin` (AUTH-CORS-002, CWE-942). Flags CORS policies
that echo the request's `Origin` back as `Access-Control-Allow-Origin` —
`res.setHeader('Access-Control-Allow-Origin', req.headers.origin)`,
`cors({ origin: true })`, and callbacks that unconditionally `cb(null, true)`.
Dynamic origin reflection is equivalent to allowing every origin and, with
credentials, becomes a CSRF/account-takeover primitive. Complements
`auth.cors.wildcard-with-credentials` (which targets literal `*`); this rule
targets dynamic reflection. Explicit string/array/regex allowlists are not
flagged.
