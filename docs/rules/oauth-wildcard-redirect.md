# `auth.oauth.wildcard-redirect`

> OAuth `redirect_uri` allow-list contains a wildcard, an `http://` URL,

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-002` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-601](https://cwe.mitre.org/data/definitions/601.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

OAuth `redirect_uri` allow-list contains a wildcard, an `http://` URL,
or `localhost`. Wildcards (and HTTP) let an attacker register their own
callback URL and harvest authorization codes; `localhost` whitelisting
is acceptable for dev tooling but disastrous in production.

Pin redirect URIs to exact, HTTPS URLs of subdomains you control. RFC 6749
§10.6 explicitly requires "exact match" or restricted matching.

## ❌ Vulnerable

```ts
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
```

## ✅ Safe

```ts
// ok: auth.oauth.wildcard-redirect
export const oauthConfigGood = {
  client_id: 'abc',
  redirect_uris: ['https://app.example.com/callback'],
};

// ok: auth.oauth.wildcard-redirect
export const oauthConfigGoodDev = {
  client_id: 'dev',
  redirect_uris: ['http://localhost:3000/callback'],
};

// ok: auth.oauth.wildcard-redirect -- loopback IP dev URL (RFC 8252)
export const oauthConfigGoodLoopback = {
  client_id: 'dev',
  redirect_uri: 'http://127.0.0.1:8080/callback',
};
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.wildcard-redirect -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6749#section-10.6
- https://datatracker.ietf.org/doc/html/rfc8252#section-7.3

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
