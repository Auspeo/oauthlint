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

// ok: auth.oauth.wildcard-redirect -- loopback IP dev URL (RFC 8252)
export const oauthConfigGoodLoopback = {
  client_id: 'dev',
  redirect_uri: 'http://127.0.0.1:8080/callback',
};
