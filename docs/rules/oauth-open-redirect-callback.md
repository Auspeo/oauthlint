# `auth.oauth.open-redirect-callback`

> The OAuth callback handler redirects to a URL taken straight from

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-008` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-601](https://cwe.mitre.org/data/definitions/601.html) |
| **OWASP** | API1:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | express |

## Why this matters

The OAuth callback handler redirects to a URL taken straight from
the request without validating it. An attacker can craft a phishing
link to your real callback that forwards the victim to a malicious
site under your domain's trust.

Maintain an explicit allow-list of post-login redirect destinations
(route names or full URLs you control). Never forward to an
arbitrary `req.query.redirect_to`, `req.query.next`, or
`req.query.return_url` value.

## ❌ Vulnerable

```ts
interface Req {
  query: { redirect_to?: string; next?: string; url?: string };
  body: { return_url?: string };
}
interface Res {
  redirect: ((url: string) => void) & ((code: number, url: string) => void);
}

export function badCallback(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback
  res.redirect(req.query.redirect_to as string);
}

export function badCallback2(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback
  res.redirect(req.body.return_url as string);
}

export function badCallback3(req: Req, res: Res) {
  const key = 'next';
  // ruleid: auth.oauth.open-redirect-callback
  res.redirect(req.query[key] as string);
}

export function badCallbackIndirect(req: Req, res: Res) {
  const next = req.query.next as string;
  // ruleid: auth.oauth.open-redirect-callback -- variable indirection
  res.redirect(next);
}

export function badCallbackDefault(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback -- logical-or default
  res.redirect((req.query.next as string) || '/');
}

export function badCallbackStatus(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback -- status + url overload
  res.redirect(302, req.query.url as string);
}
```

## ✅ Safe

```ts
interface Req {
  query: { next?: string };
}
interface Res {
  redirect: (url: string) => void;
}

// ok: auth.oauth.open-redirect-callback -- map the input to a controlled constant
const DESTINATIONS: Record<string, string> = {
  profile: '/profile',
  settings: '/settings',
};
export function goodCallback(req: Req, res: Res) {
  switch (req.query.next) {
    case 'profile':
      res.redirect(DESTINATIONS.profile);
      return;
    case 'settings':
      res.redirect(DESTINATIONS.settings);
      return;
    default:
      res.redirect('/dashboard');
  }
}

// ok: auth.oauth.open-redirect-callback -- always redirects to a fixed destination
export function goodCallback2(_req: Req, res: Res) {
  res.redirect('/dashboard');
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.open-redirect-callback -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
