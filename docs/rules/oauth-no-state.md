# `auth.oauth.no-state`

> OAuth 2.0 authorization request is being built WITHOUT a `state`

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

OAuth 2.0 authorization request is being built WITHOUT a `state`
parameter. This opens you to CSRF attacks during the OAuth dance —
an attacker can trick the victim into logging in as the attacker.

Always generate a cryptographically random `state`, store it in a
session/cookie, and validate it on the callback. PKCE alone is not a
substitute for `state` when handling browser sessions.

## ❌ Vulnerable

```ts
// ruleid: auth.oauth.no-state
export const authorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&response_type=code&scope=openid%20email&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb';

export function badRedirect(res: { redirect: (url: string) => void }) {
  // ruleid: auth.oauth.no-state
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
```

## ✅ Safe

```ts
import { randomBytes } from 'node:crypto';

// ok: auth.oauth.no-state
export function goodRedirect(res: { redirect: (url: string) => void }) {
  const state = randomBytes(32).toString('hex');
  const params = new URLSearchParams({
    client_id: 'abc',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.no-state -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6749#section-10.12

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
