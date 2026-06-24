# `auth.secret.public-env-secret`

> A secret is being read from an environment variable whose name carries a

| | |
|---|---|
| **OAuthLint id** | `AUTH-SECRET-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-200](https://cwe.mitre.org/data/definitions/200.html) |
| **OWASP** | A02:2021 |
| **Languages** | javascript, typescript |
| **Technologies** | next.js, vite, create-react-app |

## Why this matters

A secret is being read from an environment variable whose name carries a
client-public prefix. Bundlers inline these variables into the browser
JavaScript at build time:

  - Next.js / webpack:        NEXT_PUBLIC_*
  - Create React App:         REACT_APP_*
  - Gatsby:                   GATSBY_*
  - SvelteKit / generic:      PUBLIC_*
  - Vite:                     VITE_*  (via import.meta.env)

Anything carried by such a variable ships to every visitor — a secret,
token, password, or private key placed here is published, not protected.

Keep the secret in a server-only variable (no public prefix) and read it
only in server code (API routes, server actions, loaders). If a value is
genuinely safe to expose (publishable key, client_id), name it so.

## ❌ Vulnerable

```ts
// ruleid: auth.secret.public-env-secret
export const apiSecret = process.env.NEXT_PUBLIC_API_SECRET;

// ruleid: auth.secret.public-env-secret
export const stripeKey = import.meta.env.VITE_STRIPE_SECRET_KEY;

// ruleid: auth.secret.public-env-secret
export const reactSecret = process.env.REACT_APP_JWT_SECRET;

// ruleid: auth.secret.public-env-secret
export const dbPassword = process.env.NEXT_PUBLIC_DB_PASSWORD;

// ruleid: auth.secret.public-env-secret
export const privateKey = process.env.PUBLIC_PRIVATE_KEY;

// ruleid: auth.secret.public-env-secret
export const gatsbyClientSecret = process.env.GATSBY_OAUTH_CLIENT_SECRET;
```

## ✅ Safe

```ts
// ok: auth.secret.public-env-secret
// Server-only secret, no public prefix — never inlined into the client bundle.
export const sessionSecret = process.env.SESSION_SECRET;

// ok: auth.secret.public-env-secret
// Server-only Stripe secret key, no public prefix.
export const stripeSecret = process.env.STRIPE_SECRET_KEY;

// ok: auth.secret.public-env-secret
// Public prefix but no secret-ish suffix — a plain URL is fine to expose.
export const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ok: auth.secret.public-env-secret
// Publishable key is designed to be public.
export const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// ok: auth.secret.public-env-secret
// Vite public URL, not a secret.
export const viteApiUrl = import.meta.env.VITE_API_URL;

// ok: auth.secret.public-env-secret
// OAuth client_id is a public identifier, not a secret.
export const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

// ok: auth.secret.public-env-secret
// Public key half of a keypair is meant to be shared.
export const pubKey = process.env.NEXT_PUBLIC_PUBLIC_KEY;

// ok: auth.secret.public-env-secret
// `API_KEY` / `TOKEN` under a public prefix are intentionally NOT flagged:
// many services ship publishable client keys / public tokens this way
// (Stripe publishable, Mapbox token, Algolia search key, Inkeep widget key).
// Flagging these would be a false positive — precision over recall here.
export const inkeepKey = process.env.NEXT_PUBLIC_INKEEP_API_KEY;
export const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
export const vitePublicKey = import.meta.env.VITE_PUBLIC_API_KEY;
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.secret.public-env-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
- https://vitejs.dev/guide/env-and-mode#env-variables
- https://owasp.org/Top10/A02_2021-Cryptographic_Failures/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
