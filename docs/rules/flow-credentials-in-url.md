# `auth.flow.credentials-in-url`

> A secret credential is placed in a URL query string. URLs leak into

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-009` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-598](https://cwe.mitre.org/data/definitions/598.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A secret credential is placed in a URL query string. URLs leak into
server access logs, reverse-proxy logs, browser history, and the
`Referer` header (sent to every third-party CDN, analytics, and ad
script on the destination page) — so any of `password`, `client_secret`,
`api_key`, `apikey`, or `secret` in the query is a leaked credential.

Send credentials in the POST request body or in the `Authorization`
header. Never in the URL.

OWASP ASVS V3.2 / CWE-598 explicitly forbid credentials in URL
parameters.

## ❌ Vulnerable

```ts
// ruleid: auth.flow.credentials-in-url
export function login(pw: string) {
  return fetch('https://api.example.com/login?password=' + pw);
}

// ruleid: auth.flow.credentials-in-url
export function callApi(secret: string) {
  return fetch(`https://api.example.com/data?secret=${secret}`);
}

// ruleid: auth.flow.credentials-in-url
export function buildAuthUrl(clientSecret: string) {
  const params = new URLSearchParams();
  params.append('client_secret', clientSecret);
  return `https://auth.example.com/token?${params.toString()}`;
}

// ruleid: auth.flow.credentials-in-url
export const apiKeyUrl = 'https://api.example.com/search?q=cats&api_key=ABC123';
```

## ✅ Safe

```ts
// ok: auth.flow.credentials-in-url -- OAuth authorization code in callback URL is normal
export function handleCallback(authCode: string) {
  return `https://app.example.com/callback?code=${authCode}`;
}

// ok: auth.flow.credentials-in-url -- CSRF state parameter is not a secret credential
export function buildState(state: string) {
  return `https://auth.example.com/authorize?response_type=code&state=${state}`;
}

// ok: auth.flow.credentials-in-url -- password sent in POST body, not the URL
export function login(password: string) {
  return fetch('https://api.example.com/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ok: auth.flow.credentials-in-url -- credential in Authorization header, not URL
export function callApi(accessToken: string) {
  return fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ok: auth.flow.credentials-in-url -- email reset link uses a non-secret reset_token name
export const resetLink = 'https://app.example.com/reset?reset_token=xyz';

// ok: auth.flow.credentials-in-url -- passing access_token as a query param to a
// provider's userinfo/API endpoint is a legitimate (sometimes mandated)
// server-side OAuth pattern, so it is deliberately not flagged.
export function fetchUserInfo(url: URL, accessToken: string) {
  url.searchParams.set('access_token', accessToken);
  return fetch(url);
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.credentials-in-url -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://owasp.org/www-project-application-security-verification-standard/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
