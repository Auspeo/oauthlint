# `auth.cors.null-origin`

> CORS is configured to allow the literal origin `'null'`. Sandboxed

| | |
|---|---|
| **OAuthLint id** | `AUTH-CORS-003` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| **OWASP** | A05:2021 |
| **Languages** | javascript, typescript |
| **Technologies** | cors, express |

## Why this matters

CORS is configured to allow the literal origin `'null'`. Sandboxed
iframes, documents loaded from `file://`, and certain cross-origin
redirects send `Origin: null`. Adding the string `'null'` to your
CORS policy therefore grants cross-origin access to ANY such context
— including an attacker's sandboxed iframe — which defeats the
same-origin policy. Combined with credentials this becomes a
CSRF / data-exfiltration primitive.

The `'null'` origin is not a safe sentinel and cannot be trusted:
it is not bound to any host. Remove it from the allowlist entirely.

Use an explicit allowlist of real, trusted origins instead:
 - `cors({ origin: 'https://app.example.com', credentials: true })`
 - `cors({ origin: ['https://app.example.com', 'https://admin.example.com'] })`

Never set `Access-Control-Allow-Origin` to the string `'null'` and
never include `'null'` in a CORS origin allowlist.

## ❌ Vulnerable

```ts
import cors from 'cors';

declare const res: {
  setHeader: (k: string, v: string) => void;
  header: (k: string, v: string) => void;
  set: (k: string, v: string) => void;
};

// ruleid: auth.cors.null-origin -- ACAO set to the literal string "null"
export function manualNullOrigin() {
  res.setHeader('Access-Control-Allow-Origin', 'null');
}

// ruleid: auth.cors.null-origin -- cors() middleware allows the "null" origin
export const nullOriginCors = cors({
  origin: 'null',
  credentials: true,
});

// ruleid: auth.cors.null-origin -- allowlist literal contains "null"
export const allowlistWithNull = cors({
  origin: ['https://app.example.com', 'null'],
  credentials: true,
});

// ruleid: auth.cors.null-origin -- allowlist variable contains "null"
const allowed = ['https://app.example.com', 'null'];
export const indirectNullOrigin = cors({
  origin: allowed,
  credentials: true,
});
```

## ✅ Safe

```ts
import cors from 'cors';

declare const res: { setHeader: (k: string, v: string) => void };

// ok: auth.cors.null-origin -- single explicit real origin
export const singleOrigin = cors({
  origin: 'https://app.example.com',
  credentials: true,
});

// ok: auth.cors.null-origin -- allowlist array with only real origins
export const allowlistOrigin = cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.cors.null-origin -- `null` keyword (not the string), out of scope
export const keywordNullOrigin = cors({
  origin: null,
  credentials: true,
});

// ok: auth.cors.null-origin -- static real origin in a manual header write
export function manualRealOrigin() {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.cors.null-origin -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://portswigger.net/web-security/cors
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
