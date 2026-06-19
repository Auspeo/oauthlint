# `auth.session.no-regeneration`

> The user is being marked as logged in (`req.session.user = ...`,

| | |
|---|---|
| **OAuthLint id** | `AUTH-SESSION-002` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-384](https://cwe.mitre.org/data/definitions/384.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express |

## Why this matters

The user is being marked as logged in (`req.session.user = ...`,
`req.session.userId = ...`, etc.) WITHOUT first regenerating the
session id. This opens the door to session-fixation attacks: an
attacker who plants a known session id in the victim's browser
before login retains access after authentication succeeds.

Call `req.session.regenerate(cb)` (or your framework's equivalent)
between authenticating the credentials and writing the user
identity onto the session.

OWASP ASVS V3.2.1: "The session id must be regenerated on
authentication".

## ❌ Vulnerable

```ts
interface Req {
  session: {
    user?: unknown;
    userId?: number;
    user_id?: number;
    uid?: number;
    authenticated?: boolean;
    isAuthenticated?: boolean;
    regenerate?: (cb: (err?: Error) => void) => void;
  };
}

export function loginBad(req: Req, user: { id: number; email: string }) {
  // ruleid: auth.session.no-regeneration
  req.session.user = user;
}

export function loginBad2(req: Req, id: number) {
  // ruleid: auth.session.no-regeneration
  req.session.userId = id;
}

export function loginBad3(req: Req) {
  // ruleid: auth.session.no-regeneration
  req.session.authenticated = true;
}
```

## ✅ Safe

```ts
interface Req {
  session: {
    user?: unknown;
    userId?: number;
    regenerate: (cb: (err?: Error) => void) => void;
  };
}

// ok: auth.session.no-regeneration -- callback form
export function loginGood(req: Req, user: { id: number; email: string }) {
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.user = user;
  });
}

// ok: auth.session.no-regeneration -- promisified async form (regenerate first)
export async function loginGoodAsync(req: Req, user: { id: number; email: string }) {
  await new Promise<void>((resolve) => req.session.regenerate(() => resolve()));
  req.session.user = user;
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.session.no-regeneration -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#renew-the-session-id-after-any-privilege-level-change

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
