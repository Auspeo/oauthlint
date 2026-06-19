# `auth.oauth.no-state-validation`

> OAuth callback handler reads `state` from the request but never

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-007` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |

## Why this matters

OAuth callback handler reads `state` from the request but never
compares it to a stored value. Sending `state` on the authorize
call is half of the CSRF mitigation; verifying it on the callback
is the other half.

Compare the received `state` to the value you stored before
redirecting (session, signed cookie, or Redis). Reject the callback
if it's missing or doesn't match.

## ❌ Vulnerable

```ts
interface Req {
  query: { state?: string; code?: string };
  body: { state?: string };
}

export function badCallback(req: Req) {
  // ruleid: auth.oauth.no-state-validation
  const state = req.query.state;
  console.log(`received state ${state}`);
  return req.query.code;
}

export function badCallback2(req: Req) {
  // ruleid: auth.oauth.no-state-validation
  return req.body.state;
}
```

## ✅ Safe

```ts
interface Req {
  query: { state?: string };
  session: { oauth_state?: string };
}

declare function verifyState(s?: string): boolean;

// ok: auth.oauth.no-state-validation
export function goodCallback(req: Req) {
  if (req.session.oauth_state !== req.query.state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}

// ok: auth.oauth.no-state-validation -- reversed operand order is still validation
export function goodCallbackReversed(req: Req) {
  if (req.query.state !== req.session.oauth_state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}

// ok: auth.oauth.no-state-validation -- validated via a helper
export function goodCallbackHelper(req: Req) {
  if (!verifyState(req.query.state)) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.no-state-validation -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6749#section-10.12

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
