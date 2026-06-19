# `auth.jwt.in-url`

> A JWT-looking value (header `eyJ…`) appears in a URL query string

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-008` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-598](https://cwe.mitre.org/data/definitions/598.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A JWT-looking value (header `eyJ…`) appears in a URL query string
or fragment. URLs leak into server logs, browser history, the
`Referer` header (sent to every third-party CDN, ad pixel, and
analytics script on the destination page), and even copy-paste
operations. A JWT in a URL is a leaked JWT.

Send JWTs in the `Authorization: Bearer …` header, or in a
`Secure; HttpOnly; SameSite` cookie. Never in the URL.

OWASP ASVS V3.2.3 explicitly forbids credentials in URL parameters.

## ❌ Vulnerable

```ts
// ruleid: auth.jwt.in-url
export const downloadLink =
  'https://api.example.com/files/123?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc';

// ruleid: auth.jwt.in-url
export const magicLink =
  'https://app.example.com/auth/magic?jwt=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZm9vIn0.xyz';

// ruleid: auth.jwt.in-url
export const fragmentLink =
  'https://app.example.com/dashboard#access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.zzz';

// ruleid: auth.jwt.in-url -- JWT in a path segment
export const pathLink =
  'https://app.example.com/verify/eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZm9vIn0.qqq';
```

## ✅ Safe

```ts
// ok: auth.jwt.in-url
export const goodLink = 'https://app.example.com/dashboard';

// ok: auth.jwt.in-url -- a non-JWT base64 redirect param, not a token
export const redirectLink = 'https://app.example.com/login?next=aHR0cHM6Ly9hcHAvaG9tZQ';

// ok: auth.jwt.in-url -- token in Authorization header, not URL
export function fetchWithToken(token: string) {
  return fetch('https://api.example.com/files/123', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.in-url -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://owasp.org/www-project-application-security-verification-standard/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
