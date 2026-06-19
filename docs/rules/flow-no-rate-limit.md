# `auth.flow.no-rate-limit`

> A `/login`, `/signin`, `/auth`, or `/reset-password` POST handler is

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-002` |
| **Severity** | INFO |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-307](https://cwe.mitre.org/data/definitions/307.html) |
| **OWASP** | API4:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express, fastify |

## Why this matters

A `/login`, `/signin`, `/auth`, or `/reset-password` POST handler is
registered without any rate-limit middleware in scope. Without a
rate limit, credential-stuffing and brute-force attacks are
essentially free for the attacker.

Add `express-rate-limit`, `@fastify/rate-limit`, or a gateway-level
WAF rule. Per-IP + per-account is the typical pairing.

## ❌ Vulnerable

```ts
type Handler = (...args: unknown[]) => unknown;
declare const app: { post: (path: string, handler: Handler) => void };
declare const router: { post: (path: string, handler: Handler) => void };
declare const fastify: { post: (path: string, handler: Handler) => void };

function loginHandler(_req: unknown, _res: unknown) {
  /* ... */
}

// ruleid: auth.flow.no-rate-limit
app.post('/login', loginHandler);

// ruleid: auth.flow.no-rate-limit
app.post('/signin', loginHandler);

// ruleid: auth.flow.no-rate-limit
app.post('/reset-password', loginHandler);

// ruleid: auth.flow.no-rate-limit -- router, not app
router.post('/auth/login', loginHandler);

// ruleid: auth.flow.no-rate-limit -- fastify
fastify.post('/login', loginHandler);

// ruleid: auth.flow.no-rate-limit -- path prefix
app.post('/api/v1/login', loginHandler);
```

## ✅ Safe

```ts
type Mw = (req: unknown, res: unknown, next: () => void) => void;
type Handler = (req: unknown, res: unknown) => void;
declare const app: {
  post: (path: string, ...rest: (Mw | Handler)[]) => void;
};

const rateLimit =
  (_opts: { max: number }): Mw =>
  (_req, _res, next) => {
    next();
  };

const loginLimiter = rateLimit({ max: 5 });
function loginHandler(_req: unknown, _res: unknown) {
  /* ... */
}

// ok: auth.flow.no-rate-limit -- rate-limit middleware present (3-arg form)
app.post('/login', loginLimiter, loginHandler);

// ok: auth.flow.no-rate-limit -- not a login endpoint
app.post('/products', loginHandler);

// ok: auth.flow.no-rate-limit -- /authorize is the OAuth authorize endpoint, not a credential login
app.post('/oauth/authorize', loginHandler);
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.no-rate-limit -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
