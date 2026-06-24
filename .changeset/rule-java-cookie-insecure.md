---
'oauthlint-rules': minor
---

Add `auth.java.cookie.insecure` (AUTH-JAVA-COOKIE-001): flags a servlet
`Cookie` whose security attribute is explicitly disabled — `setSecure(false)`
or `setHttpOnly(false)`. With `setSecure(false)` the cookie travels over plain
HTTP; with `setHttpOnly(false)` it is readable from JavaScript — either way a
session or auth cookie can be stolen (CWE-614, OWASP A05:2021). Only the literal
`false` argument is matched; `setSecure(true)`, `setHttpOnly(true)`, and the
absence of the call are not flagged. Works on any `jakarta`/`javax` servlet
`Cookie` instance.
