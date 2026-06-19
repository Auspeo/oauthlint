// ok: auth.oauth.wildcard-redirect
export const oauthConfigGood = {
  client_id: 'abc',
  redirect_uris: ['https://app.example.com/callback'],
};

// ok: auth.oauth.wildcard-redirect
export const oauthConfigGoodDev = {
  client_id: 'dev',
  redirect_uris: ['http://localhost:3000/callback'],
};
