# `auth.cors.reflect-origin`

> CORS is configured to echo the request's `Origin` back as

| | |
|---|---|
| **OAuthLint id** | `AUTH-CORS-002` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| **OWASP** | A05:2021 |
| **Languages** | javascript, typescript |
| **Technologies** | cors, express |

## Why this matters

CORS is configured to echo the request's `Origin` back as
`Access-Control-Allow-Origin`. Reflecting the incoming origin is
functionally identical to allowing EVERY origin: any site can make
cross-origin requests and read the responses. Combined with
credentials this becomes a CSRF / account-takeover primitive, because
the browser will attach the victim's cookies to the attacker-controlled
request.

This is distinct from a literal `*` wildcard — here the origin is
reflected dynamically, which silently defeats the same-origin policy
while looking "scoped" in code review.

Use an explicit allowlist of trusted origins instead:
 - `cors({ origin: 'https://app.example.com', credentials: true })`
 - `cors({ origin: ['https://app.example.com', 'https://admin.example.com'] })`
 - a callback that validates against an allowlist before calling
   `cb(null, true)`.

Never set `Access-Control-Allow-Origin` to `req.headers.origin`, never
use `origin: true`, and never write a callback that unconditionally
returns `cb(null, true)`.

## ❌ Vulnerable

```ts
import cors from 'cors';

declare const res: {
  setHeader: (k: string, v: string) => void;
  header: (k: string, v: string) => void;
  set: (k: string, v: string) => void;
};
declare const req: { headers: Record<string, string>; header: (k: string) => string; get: (k: string) => string };

// ruleid: auth.cors.reflect-origin -- echoes req origin into ACAO
export function manualReflect() {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// ruleid: auth.cors.reflect-origin -- res.header() reflecting origin
export function reflectViaHeader() {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
}

// ruleid: auth.cors.reflect-origin -- origin: true echoes the request origin
export const reflectiveCors = cors({
  origin: true,
  credentials: true,
});

// ruleid: auth.cors.reflect-origin -- callback unconditionally accepts everything
export const allowAllCors = cors({
  origin: (_origin: string, cb: (e: null, ok: boolean) => void) => cb(null, true),
  credentials: true,
});
```

## ✅ Safe

```ts
import cors from 'cors';

declare const res: { setHeader: (k: string, v: string) => void };

// ok: auth.cors.reflect-origin -- single explicit origin
export const singleOrigin = cors({
  origin: 'https://app.example.com',
  credentials: true,
});

// ok: auth.cors.reflect-origin -- explicit allowlist array
export const allowlistOrigin = cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.cors.reflect-origin -- regex allowlist, not dynamic reflection
export const regexOrigin = cors({
  origin: /\.example\.com$/,
  credentials: true,
});

// ok: auth.cors.reflect-origin -- callback validates against an allowlist
const allow = new Set(['https://app.example.com']);
export const checkedOrigin = cors({
  origin: (origin: string, cb: (e: null, ok: boolean) => void) => cb(null, allow.has(origin)),
  credentials: true,
});

// ok: auth.cors.reflect-origin -- static, explicit header value
export function manualStatic() {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cors.reflect-origin -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://portswigger.net/web-security/cors
- https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
