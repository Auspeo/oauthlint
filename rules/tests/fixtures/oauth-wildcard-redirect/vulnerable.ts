// ruleid: auth.oauth.wildcard-redirect
export const oauthConfigBad = {
  client_id: 'abc',
  redirect_uris: ['https://*.example.com/callback'],
};

// ruleid: auth.oauth.wildcard-redirect
export const oauthConfigBad2 = {
  client_id: 'abc',
  redirect_uris: ['http://app.example.com/callback'],
};

// ruleid: auth.oauth.wildcard-redirect
export const oauthConfigBad3 = {
  client_id: 'abc',
  redirect_uri: 'https://app.example.com/*',
};

// ruleid: auth.oauth.wildcard-redirect -- scalar http:// redirect_uri
export const oauthConfigBad4 = {
  client_id: 'abc',
  redirect_uri: 'http://app.example.com/callback',
};
