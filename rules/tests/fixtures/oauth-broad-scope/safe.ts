// ok: auth.oauth.broad-scope
export const goodConfig = {
  scope: 'openid email profile',
};

// ok: auth.oauth.broad-scope
export const goodConfig2 = {
  scopes: ['read:user', 'repo:status'],
};
