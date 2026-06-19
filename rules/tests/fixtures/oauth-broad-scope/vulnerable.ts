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

// ruleid: auth.oauth.broad-scope -- standalone "admin" among space-delimited scopes
export const badConfig5 = {
  scope: 'read admin write',
};

// ruleid: auth.oauth.broad-scope -- entire GitHub repo access
export const badConfig6 = {
  scopes: ['repo', 'read:user'],
};

// ruleid: auth.oauth.broad-scope -- full Gmail mailbox
export const badConfig7 = {
  scope: 'https://mail.google.com/',
};
