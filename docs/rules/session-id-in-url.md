# `auth.session.id-in-url`

> A session token / id appears in a URL query string. URLs are

| | |
|---|---|
| **OAuthLint id** | `AUTH-SESSION-001` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-598](https://cwe.mitre.org/data/definitions/598.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A session token / id appears in a URL query string. URLs are
logged everywhere (web server logs, reverse proxies, browser
history, referrer headers leaking to third-party CDNs and ad
networks), so this leaks the credential.

Pass session ids/tokens in the `Authorization` header or in a
`Secure; HttpOnly` cookie. Never in the URL.

OWASP ASVS V3.2 explicitly bans this pattern.

## ❌ Vulnerable

```ts
// ruleid: auth.session.id-in-url
export const badLink = `/api/profile?session=${'sid-abc-123-very-long-here'}`;

// ruleid: auth.session.id-in-url
export const badLink2 = '/api/admin?api_key=secret-key-here-very-long';

// ruleid: auth.session.id-in-url
export const badLink3 = '/api/data?access_token=eyJabc123';
```

## ✅ Safe

```ts
// ok: auth.session.id-in-url -- regular query strings, no credentials
export const goodLink = '/api/profile?include=settings';

// ok: auth.session.id-in-url -- Authorization header is the right place
export function fetchWithAuth(url: string, token: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.session.id-in-url -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://owasp.org/www-project-application-security-verification-standard/

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
