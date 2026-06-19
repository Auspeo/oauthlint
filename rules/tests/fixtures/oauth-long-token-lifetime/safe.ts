// ok: auth.oauth.long-token-lifetime
export const oauthGood = {
  access_token: 'redacted',
  expires_in: 900,
};

// ok: auth.oauth.long-token-lifetime -- exactly at the threshold (≤ 1 day)
export const oauthBoundary = {
  expiresIn: 86400,
};
