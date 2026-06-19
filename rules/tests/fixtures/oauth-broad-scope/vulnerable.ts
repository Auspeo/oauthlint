// ruleid: auth.oauth.broad-scope
export const badConfig = {
  scope: 'admin',
};

// ruleid: auth.oauth.broad-scope
export const badConfig2 = {
  scopes: ['admin', 'read:profile'],
};

// ruleid: auth.oauth.broad-scope
export const badConfig3 = {
  scope: 'full_access',
};

// ruleid: auth.oauth.broad-scope
export const badConfig4 = {
  scope: 'openid email *',
};
