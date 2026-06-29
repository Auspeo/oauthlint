---
"oauthlint-rules": patch
"oauthlint": patch
---

Reduce false positives from the multi-language OAuth rules.

A real-world validation run found that the new `ropc-grant` and `static-state`
rules fired on the OAuth reference libraries' own source, examples, and tests:

- `auth.py.oauth.ropc-grant` and `auth.oauth.ropc-grant` no longer match a bare
  `grant_type = "password"` assignment (a library's internal grant resolver).
  They require a request-body key or a call argument, which is what application
  misuse looks like.
- `auth.rust.oauth.static-state` no longer fires inside `#[cfg(test)] mod tests`
  blocks, where a fixed `CsrfToken` is test scaffolding rather than a shipped
  constant.
- The `ropc-grant` and `static-state` rules now skip test, example, vendored,
  and generated paths through rule-level `paths: exclude`.
- next-auth false positives are cleared: `auth.flow.open-redirect` now requires
  an explicit receiver (it targets `res.redirect`, not the framework-level
  `redirect()` primitive), and `ssrf`, `timing-unsafe-compare`, and
  `samesite-none-insecure` skip example, docs, and vendored code.

Detection on real application anti-patterns is unchanged: every rule fixture
still fires. The rule schema now accepts an optional `paths` field.
