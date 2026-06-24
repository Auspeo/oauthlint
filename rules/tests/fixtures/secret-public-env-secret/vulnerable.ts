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
