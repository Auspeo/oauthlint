---
'oauthlint-rules': minor
---

Add `auth.secret.public-env-secret` (AUTH-SECRET-002, CWE-200). Flags secrets
read from environment variables that carry a client-public prefix and so get
inlined into the browser bundle: `process.env` with `NEXT_PUBLIC_` / `REACT_APP_`
/ `GATSBY_` / `PUBLIC_`, and `import.meta.env` with `VITE_`, where the name also
contains a secret-ish suffix (`SECRET`, `PRIVATE`, `PASSWORD`, `API_KEY`,
`_TOKEN`, `ACCESS_TOKEN`, `CLIENT_SECRET`). Anything on such a variable ships to
every visitor, so the secret is published rather than protected. Keep it in a
server-only variable. Genuinely public values are not flagged: server-only env
without a public prefix (`SESSION_SECRET`, `STRIPE_SECRET_KEY`), public values
without a secret suffix (`NEXT_PUBLIC_API_URL`, `VITE_API_URL`), and deliberately
public names (`PUBLISHABLE`, `CLIENT_ID`, `PUBLIC_KEY`) are all excluded.
