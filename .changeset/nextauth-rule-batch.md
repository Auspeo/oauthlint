---
"oauthlint-rules": minor
---

Add 10 framework-aware, low-false-positive rules for the two frameworks AI
coding tools most often generate in JavaScript/TypeScript: Auth.js / NextAuth
and Express. Each rule is anchored to a real framework shape and validated to
fire zero times across a corpus of mature real-world code (the next-auth,
directus, and vercel/ai-chatbot sources among others).

Auth.js / NextAuth:

- `auth.nextauth.redirect-open`: the `redirect` callback returns the incoming
  `url` without validating it against `baseUrl` (open redirect).
- `auth.nextauth.authorized-always-true`: the `authorized` callback returns a
  constant `true`, disabling middleware route protection (auth bypass).
- `auth.nextauth.cookie-insecure`: a custom session cookie sets `secure: false`
  or `httpOnly: false`.
- `auth.nextauth.session-token-leak`: the `session` callback copies an OAuth
  access/refresh/id token onto the client-visible session object.
- `auth.nextauth.debug-enabled`: `debug: true` is hard-coded, risking verbose
  token/PII logging in production.

Express:

- `auth.express.trust-proxy-true`: `trust proxy` is set to `true` (trust every
  proxy), enabling `X-Forwarded-*` spoofing.
- `auth.express.helmet-disabled-protection`: `helmet()` is configured with a
  core protection (CSP, HSTS, frameguard, or noSniff) turned off.
- `auth.express.cookie-parser-secret`: `cookie-parser` is initialized with a
  hard-coded string signing secret.
- `auth.express.auth-middleware-noop`: an auth-named middleware whose whole body
  is `next()`, a stubbed guard that authorizes every request.
- `auth.express.static-dotfiles-allow`: static file serving is set to serve
  dotfiles (exposing `.env`, `.git/`, and similar).
