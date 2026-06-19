# `auth.cors.wildcard-with-credentials`

> CORS is configured with `Access-Control-Allow-Origin: *` and

| | |
|---|---|
| **OAuthLint id** | `AUTH-CORS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express, cors |

## Why this matters

CORS is configured with `Access-Control-Allow-Origin: *` and
`Access-Control-Allow-Credentials: true` at the same time. The
spec forbids this combination — browsers will block it — but
developers regularly try to "fix" the resulting error by switching
to `origin: true` (which echoes the requesting origin back),
effectively turning the policy into "allow credentials from
ANYWHERE". That's a CSRF-on-steroids primitive.

Decide which one you actually need:
 - Public API, no cookies/auth headers needed cross-site →
   `origin: '*'`, `credentials: false` (default).
 - Authenticated API for a known frontend → enumerate the exact
   origins, `credentials: true`.

Never combine wildcard origins with credentials enabled.

## ❌ Vulnerable

```ts
import cors from 'cors';

// ruleid: auth.cors.wildcard-with-credentials
export const badCors = cors({
  origin: '*',
  credentials: true,
});

// ruleid: auth.cors.wildcard-with-credentials
export const badCorsReflective = cors({
  origin: true,
  credentials: true,
});

// ruleid: auth.cors.wildcard-with-credentials
export const badCorsReversed = cors({
  credentials: true,
  origin: '*',
});

// ruleid: auth.cors.wildcard-with-credentials -- echoes the request origin back
export const badCorsEcho = cors({
  origin: (_origin: string, cb: (e: null, ok: boolean) => void) => cb(null, true),
  credentials: true,
});

declare const res: { setHeader: (k: string, v: string) => void };
// ruleid: auth.cors.wildcard-with-credentials -- manual headers
export function manualCors() {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

## ✅ Safe

```ts
import cors from 'cors';

// ok: auth.cors.wildcard-with-credentials -- wildcard, no credentials
export const publicApi = cors({
  origin: '*',
  credentials: false,
});

// ok: auth.cors.wildcard-with-credentials -- credentials with explicit allow-list
export const authedApi = cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.cors.wildcard-with-credentials -- callback validates against an allow-list
const allow = new Set(['https://app.example.com']);
export const checkedApi = cors({
  origin: (origin: string, cb: (e: null, ok: boolean) => void) => cb(null, allow.has(origin)),
  credentials: true,
});

declare const res: { setHeader: (k: string, v: string) => void };
// ok: auth.cors.wildcard-with-credentials -- explicit origin, not wildcard
export function manualOk() {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cors.wildcard-with-credentials -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
- https://portswigger.net/web-security/cors

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
