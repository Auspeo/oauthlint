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

declare const config: { expires_in: number };
// ruleid: auth.oauth.long-token-lifetime -- member assignment
config.expires_in = 604800;

// ruleid: auth.oauth.long-token-lifetime -- jsonwebtoken string duration (30 days)
export const jwtOpts = { expiresIn: '30d' };

// ruleid: auth.oauth.long-token-lifetime -- 2 weeks
export const jwtOpts2 = { expiresIn: '2w' };
