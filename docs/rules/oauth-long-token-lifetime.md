# `auth.oauth.long-token-lifetime`

> An OAuth `expires_in` (or comparable token-lifetime field) is being

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-009` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-613](https://cwe.mitre.org/data/definitions/613.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |

## Why this matters

An OAuth `expires_in` (or comparable token-lifetime field) is being
set to a literal value greater than 86_400 seconds — i.e. longer
than 24 hours. Long-lived access tokens make every token theft
catastrophic because they remain valid for days or weeks; the
industry standard is 15-60 minutes for access tokens, paired with
a refresh-token rotation flow for longer sessions.

Don't issue access tokens longer than a day. Use refresh tokens
with proper rotation (RFC 6749 §6, RFC 9700 §4.14) for "stay
logged in" semantics.

## ❌ Vulnerable

```ts
// ruleid: auth.oauth.long-token-lifetime
export const oauthBad = {
  access_token: 'redacted',
  expires_in: 604800,
};

// ruleid: auth.oauth.long-token-lifetime
export const oauthBad2 = {
  client_id: 'app',
  expiresIn: 2592000,
};

// ruleid: auth.oauth.long-token-lifetime
export const oauthBad3 = {
  tokenLifetime: 86401,
};

declare const config: { expires_in: number };
// ruleid: auth.oauth.long-token-lifetime -- member assignment
config.expires_in = 604800;

// ruleid: auth.oauth.long-token-lifetime -- jsonwebtoken string duration (30 days)
export const jwtOpts = { expiresIn: '30d' };

// ruleid: auth.oauth.long-token-lifetime -- 2 weeks
export const jwtOpts2 = { expiresIn: '2w' };
```

## ✅ Safe

```ts
// ok: auth.oauth.long-token-lifetime
export const oauthGood = {
  access_token: 'redacted',
  expires_in: 900,
};

// ok: auth.oauth.long-token-lifetime -- exactly at the threshold (≤ 1 day)
export const oauthBoundary = {
  expiresIn: 86400,
};

// ok: auth.oauth.long-token-lifetime -- short string durations are fine
export const shortJwt = { expiresIn: '15m' };
export const oneDayJwt = { expiresIn: '1d' };
export const hoursJwt = { expiresIn: '12h' };
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.long-token-lifetime -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc9700#section-4.14
- https://datatracker.ietf.org/doc/html/rfc6749#section-6

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
