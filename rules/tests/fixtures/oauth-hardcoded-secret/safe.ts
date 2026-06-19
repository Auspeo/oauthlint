// ok: auth.oauth.hardcoded-secret
export const oauthGood = {
  client_id: process.env.OAUTH_CLIENT_ID!,
  client_secret: process.env.OAUTH_CLIENT_SECRET!,
};

// ok: auth.oauth.hardcoded-secret -- placeholder values for docs are fine
export const sample = {
  client_secret: '<your-client-secret>',
};

// ok: auth.oauth.hardcoded-secret -- example placeholder
export const docsExample = {
  clientSecret: 'your-secret-here',
};
