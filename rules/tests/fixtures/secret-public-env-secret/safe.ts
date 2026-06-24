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
