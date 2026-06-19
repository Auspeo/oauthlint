# `auth.oauth.implicit-flow`

> OAuth implicit flow (`response_type=token` or `response_type=id_token

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-005` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-1004](https://cwe.mitre.org/data/definitions/1004.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

OAuth implicit flow (`response_type=token` or `response_type=id_token
token`) is deprecated by OAuth 2.0 Security BCP (RFC 9700) and the
OAuth 2.1 working draft. The access token leaks into the URL
fragment, browser history, and referrer headers, and there is no
refresh-token mechanism.

Migrate to authorization code + PKCE (`response_type=code` with a
`code_challenge`). All modern OAuth providers (Google, Microsoft,
Auth0, Okta, Keycloak, WSO2) support this for SPAs and native apps.

## ❌ Vulnerable

```ts
export const badConfig = {
  // ruleid: auth.oauth.implicit-flow
  response_type: 'token',
  client_id: 'spa-app',
};

// ruleid: auth.oauth.implicit-flow
export const badUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=spa-app';

export const badConfig2 = {
  // ruleid: auth.oauth.implicit-flow
  response_type: 'id_token token',
};

// ruleid: auth.oauth.implicit-flow -- URL-encoded multi-value response_type
export const badUrlEncoded =
  'https://accounts.google.com/o/oauth2/v2/auth?response_type=token%20id_token&client_id=spa';
```

## ✅ Safe

```ts
// ok: auth.oauth.implicit-flow
export const goodConfig = {
  response_type: 'code',
  client_id: 'spa-app',
};

// ok: auth.oauth.implicit-flow
export const goodUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=spa-app&code_challenge=abc';
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.implicit-flow -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc9700

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
