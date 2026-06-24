# `auth.flow.secret-in-log`

> A secret-shaped value (`password`, `token`, `secret`, `apiKey`,

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-008` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-532](https://cwe.mitre.org/data/definitions/532.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A secret-shaped value (`password`, `token`, `secret`, `apiKey`,
`accessToken`, `refreshToken`, `privateKey`, `clientSecret`, …) is
being passed to a logging call (`console.*` or `logger.*`). Logs are
routinely written to files, shipped to aggregators (Datadog, Splunk,
CloudWatch) and read by people who should never see the raw secret —
this is a textbook credential leak.

Never log secrets. Redact or mask them before logging
(`token.slice(0, 4) + '…'`), log a non-sensitive identifier instead
(a user id, a key id), or drop the field entirely.

## ❌ Vulnerable

```ts
declare const password: string;
declare const token: string;
declare const apiKey: string;
declare const refreshToken: string;
declare const clientSecret: string;
declare const err: Error;
declare const logger: { info: (...a: unknown[]) => void; error: (...a: unknown[]) => void; debug: (...a: unknown[]) => void };

export function logPassword() {
  // ruleid: auth.flow.secret-in-log
  console.log(password);
}

export function logTokenWithLabel() {
  // ruleid: auth.flow.secret-in-log
  logger.info('user logged in', token);
}

export function logErrorWithApiKey() {
  // ruleid: auth.flow.secret-in-log
  console.error(err, apiKey);
}

export function logRefreshToken() {
  // ruleid: auth.flow.secret-in-log
  console.debug(refreshToken);
}

export function logInterpolatedToken() {
  // ruleid: auth.flow.secret-in-log
  console.log(`token=${token}`);
}

export function logClientSecretViaLogger() {
  // ruleid: auth.flow.secret-in-log
  logger.error('oauth exchange failed', clientSecret, err);
}
```

## ✅ Safe

```ts
declare const token: string;
declare const user: { id: string };
declare const userId: string;
declare const logger: { info: (...a: unknown[]) => void };

export function statusMessages() {
  // ok: auth.flow.secret-in-log -- literal status text, no secret value
  console.log('password updated');
  // ok: auth.flow.secret-in-log
  console.log('reset token sent');
  // ok: auth.flow.secret-in-log
  console.log('login ok');
}

export function nonSecretIdentifiers() {
  // ok: auth.flow.secret-in-log -- member access, not a secret-named identifier
  console.log(user.id);
  // ok: auth.flow.secret-in-log
  logger.info({ userId });
}

export function redactedToken() {
  // ok: auth.flow.secret-in-log -- redacted, the argument is an expression not a bare secret identifier
  console.log('token prefix', token.slice(0, 4));
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.secret-in-log -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/532.html
- https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
