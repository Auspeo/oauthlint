// ok: auth.oauth.broad-scope
export const goodConfig = {
  scope: 'openid email profile',
};

// ok: auth.oauth.broad-scope
export const goodConfig2 = {
  scopes: ['read:user', 'repo:status'],
};

// Narrow structured sub-scopes that merely contain a broad word as a segment —
// must not be flagged (regression guards for the substring false positive).
// ok: auth.oauth.broad-scope -- read-only admin sub-scope
export const narrow1 = { scope: 'admin:read' };
// ok: auth.oauth.broad-scope -- Slack channel admin, narrow
export const narrow2 = { scope: 'channels:admin' };
// ok: auth.oauth.broad-scope -- Google calendar narrow scope
export const narrow3 = { scope: 'calendar.all' };
// ok: auth.oauth.broad-scope -- public repos only, narrower than "repo"
export const narrow4 = { scope: 'public_repo' };
