# `auth.session.hardcoded-secret`

> An `express-session` / `cookie-session` `secret` is set to a hard-coded

| | |
|---|---|
| **OAuthLint id** | `AUTH-SESSION-003` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | A07:2021 |
| **Languages** | javascript, typescript |
| **Technologies** | express-session, cookie-session |

## Why this matters

An `express-session` / `cookie-session` `secret` is set to a hard-coded
string literal (the infamous `secret: 'keyboard cat'` is the canonical
AI-generated example). This key signs the session cookie: anyone who
reads it from your source or git history can forge arbitrary session
cookies and impersonate any user.

Load the secret from the environment (`process.env.SESSION_SECRET`) or a
secret manager, and rotate it out of source control. Add a placeholder
to `.env.example` so contributors know it is required.

## ❌ Vulnerable

```ts
import session from 'express-session';
import cookieSession from 'cookie-session';

// ruleid: auth.session.hardcoded-secret
app.use(session({ secret: 'keyboard cat' }));

// ruleid: auth.session.hardcoded-secret
app.use(session({ secret: 'mysecret', resave: false, saveUninitialized: false }));

// ruleid: auth.session.hardcoded-secret
app.use(cookieSession({ secret: 'abc123', name: 'sess' }));

// ruleid: auth.session.hardcoded-secret
const middleware = session({
  secret: 'super-secret-prod-key',
  cookie: { maxAge: 3600000 },
});
```

## ✅ Safe

```ts
import session from 'express-session';
import cookieSession from 'cookie-session';

// ok: auth.session.hardcoded-secret -- loaded from the environment
app.use(session({ secret: process.env.SESSION_SECRET! }));

// ok: auth.session.hardcoded-secret -- pulled from config object
app.use(session({ secret: config.sessionSecret, resave: false }));

// ok: auth.session.hardcoded-secret -- resolved at runtime via secret manager
app.use(cookieSession({ secret: loadSecret(), name: 'sess' }));
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.session.hardcoded-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://github.com/expressjs/session#secret
- https://cwe.mitre.org/data/definitions/798.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
