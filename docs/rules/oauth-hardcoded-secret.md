# `auth.oauth.hardcoded-secret`

> An OAuth `client_secret` (or similarly sensitive credential) is being

| | |
|---|---|
| **OAuthLint id** | `AUTH-OAUTH-003` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |

## Why this matters

An OAuth `client_secret` (or similarly sensitive credential) is being
assigned a hard-coded string literal. The moment this lands in git, it
is one search away from compromise.

Replace the literal with `process.env.OAUTH_CLIENT_SECRET` (or your
secret manager equivalent) and add the variable to `.env.example` with
a placeholder so contributors know it is required.

GitGuardian 2026 found 28.6M public secrets on GitHub, with Claude Code
commits leaking at 2x baseline. This is the most common AI-coding leak.

## ❌ Vulnerable

```ts
// ruleid: auth.oauth.hardcoded-secret
export const oauthBad = {
  client_id: 'app-prod',
  client_secret: 'sk_live_abc123XYZ789verylong',
};

// ruleid: auth.oauth.hardcoded-secret
export const oauthBad2 = {
  clientId: 'app-prod',
  clientSecret: 'super-secret-value-here-abcdef',
};

// ruleid: auth.oauth.hardcoded-secret
export const config = {
  CLIENT_SECRET: 'GOCSPX-aaaaaaaaaaaaaaaaaaaaaaa',
};
```

## ✅ Safe

```ts
// ok: auth.oauth.hardcoded-secret
export const oauthGood = {
  client_id: process.env.OAUTH_CLIENT_ID!,
  client_secret: process.env.OAUTH_CLIENT_SECRET!,
};

// ok: auth.oauth.hardcoded-secret -- placeholder values for docs are fine
export const sample = {
  client_secret: '<your-client-secret>',
};

// ok: auth.oauth.hardcoded-secret -- example placeholder
export const docsExample = {
  clientSecret: 'your-secret-here',
};

// ok: auth.oauth.hardcoded-secret -- obvious test stubs, not a real leak
export const testStub = {
  clientSecret: 'test1234secret',
  client_secret: 'dummy-secret-for-tests',
};
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.oauth.hardcoded-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
- https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
