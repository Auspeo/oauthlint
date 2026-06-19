// ruleid: auth.oauth.long-token-lifetime
export const oauthBad = {
  access_token: 'redacted',
  expires_in: 604800,
};

// ruleid: auth.oauth.long-token-lifetime
export const oauthBad2 = {
  client_id: 'app',
  expiresIn: 2592000,
};

// ruleid: auth.oauth.long-token-lifetime
export const oauthBad3 = {
  tokenLifetime: 86401,
};
