---
'oauthlint-rules': minor
---

Add `auth.session.hardcoded-secret` (AUTH-SESSION-003): flags hard-coded string
literals passed as the `secret` option to `express-session` / `cookie-session`
(the canonical `secret: 'keyboard cat'`). A hard-coded signing secret lets
anyone forge session cookies (CWE-798). `process.env`, config references, and
function calls are not flagged.
