---
"oauthlint-rules": minor
---

Add six Auth.js / NextAuth rules for the most common anti-patterns AI coding
tools generate in that framework. Each is anchored to a real NextAuth/Auth.js
config (or its `callbacks` object) and validated to fire zero times on the
next-auth library source:

- `auth.nextauth.redirect-open`: the `redirect` callback returns the incoming
  `url` without validating it against `baseUrl` (open redirect).
- `auth.nextauth.authorized-always-true`: the `authorized` callback returns a
  constant `true`, disabling the middleware route protection (auth bypass).
- `auth.nextauth.cookie-insecure`: a custom session cookie sets `secure: false`
  or `httpOnly: false`.
- `auth.nextauth.session-token-leak`: the `session` callback copies an OAuth
  access/refresh/id token onto the client-visible session object.
- `auth.nextauth.trust-host-enabled`: `trustHost: true` is hard-coded
  (host-header trust) instead of gated on the environment.
- `auth.nextauth.debug-enabled`: `debug: true` is hard-coded, risking verbose
  token/PII logging in production.
