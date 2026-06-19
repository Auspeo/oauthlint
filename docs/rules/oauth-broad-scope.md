# `auth.oauth.broad-scope`

> OAuth scope request includes an over-broad scope such as `admin`,

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-006` |
| **Severity** | INFO |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-272](https://cwe.mitre.org/data/definitions/272.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

OAuth scope request includes an over-broad scope such as `admin`,
`full_access`, `*`, or `repo` (entire GitHub access). LLMs default
to the widest scope that "works", but every extra scope expands
the blast radius if the access token is leaked or replayed.

Request the narrowest scope that satisfies your feature. Examples:
use `repo:status` instead of `repo`, `gmail.send` instead of
`https://mail.google.com/`, and scope down to `read:user` when you
only need a profile.

## ❌ Vulnerable

```ts
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
```

## ✅ Safe

```ts
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
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.broad-scope -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6749#section-3.3

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
