---
"oauthlint-rules": patch
---

Fix four JS/TS rules that failed to parse on the shipped Opengrep engine and
tighten the plaintext-password rule to cut a false positive.

- `auth.nestjs.guard-always-true`, `auth.nextauth.redirect-open`,
  `auth.nextauth.authorized-always-true`, and `auth.nextauth.session-token-leak`
  used a bare method-shorthand pattern (`canActivate($CTX) {...}`,
  `session($P) {...}`), which is not a standalone-parseable JS/TS snippet. On
  Opengrep (the engine the CLI, Action, and pre-commit hook ship) this raised
  `Invalid pattern for JavaScript: Stdlib.Parsing.Parse_error` and the rule
  produced zero results. Each method is now wrapped in a parseable enclosing
  node (`class $K { ... }` for the guard, `{ session($P) {...} }` for the
  callbacks), so the rules parse on both Opengrep and Semgrep while still
  matching the same vulnerable method-shorthand and arrow forms.
- `auth.flow.password-plaintext` now fires only when the persisted value is a
  raw password reference (`password` or a `X.password` member chain) instead of
  "any expression that is not an inline hash call". This removes the false
  positive where a password is hashed into an intermediate variable and then
  persisted (`const digest = await bcrypt.hash(pw); User.create({ password:
  digest })`), which the previous name-based carve-out missed unless the
  variable name contained "hash".
