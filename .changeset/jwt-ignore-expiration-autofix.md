---
"oauthlint-rules": patch
---

Add a safe, deterministic autofix to `auth.jwt.ignore-expiration`: flip
`ignoreExpiration: true` to `ignoreExpiration: false` so the `jsonwebtoken`
expiry check is re-enabled. The matched node is narrowed to the offending
property (the `verify` call is scoped with `pattern-inside`), so the rewrite
touches only that boolean and leaves every sibling option intact; `false` is the
library default and the value the rule already treats as compliant. Detection is
unchanged, and the fix is covered by the autofix safety contract
(`fixes.test.ts`).
