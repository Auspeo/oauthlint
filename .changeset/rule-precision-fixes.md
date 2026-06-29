---
"oauthlint-rules": patch
---

Precision fixes across the OAuth and flow rules, with no loss of real detection.

- Go SSRF and open-redirect: `url.Parse` is no longer treated as a sanitizer
  (parsing does not validate the host), so a parse-then-use flow is now caught
  while a parse-then-host-checked flow stays clean.
- JS open-redirect, SSRF, and open-redirect-callback: an inline allowlist guard
  (`if (allow.has(url)) ...`) now clears taint, removing false positives on
  correctly guarded redirects.
- Constrained the JS request taint sources to conventional request object names,
  so an unrelated object with a `.query`, `.body`, or `.headers` property is no
  longer treated as a source.
- Replaced the over-broad `**/apps/**` path exclusion, which hid production code
  in monorepos, with narrower demo and example excludes.
- Java trust-all-certs fires only inside a `setHostnameVerifier` call, not on any
  two-argument lambda that returns true.
- `auth.oauth.no-state` and `auth.oauth.static-state` evaluate per URL literal
  instead of across the whole file, fixing false negatives and false positives
  when a file contains more than one authorization URL.
