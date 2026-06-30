---
"oauthlint-rules": minor
---

Framework-aware rules. Eight new pattern-mode rules targeting the auth frameworks
AI coding tools reach for most, each validated against real framework code for a
low false-positive rate:

- Spring Security: `NoOpPasswordEncoder` / `withDefaultPasswordEncoder` (plaintext
  passwords), a catch-all `requestMatchers("/**").permitAll()`, and
  `web.ignoring().requestMatchers("/**")` (whole filter chain bypassed).
- NextAuth / Auth.js: a hardcoded `secret` in the config.
- Passport: a `passport-jwt` strategy with `ignoreExpiration: true`.
- FastAPI: `CORSMiddleware` with a wildcard origin and `allow_credentials=True`.
- passlib: a `CryptContext` configured with a weak or plaintext scheme.
- PyJWT: `decode(..., options={"verify_aud": False})` / `verify_iss` / `verify_nbf`.

The pack is now 149 rules.
