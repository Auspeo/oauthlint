# `auth.jwt.localstorage`

> A JWT (or other auth token) is being written to `localStorage`. Any

| | |
|---|---|
| **OAuthLint id** | `AUTH-JWT-005` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-922](https://cwe.mitre.org/data/definitions/922.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A JWT (or other auth token) is being written to `localStorage`. Any
XSS that lands on the page can exfiltrate the token via
`localStorage.getItem(...)` — and unlike `HttpOnly` cookies, there
is no browser-side mitigation.

Store auth tokens in an `HttpOnly; Secure; SameSite=Strict` cookie
set by the server, or in memory only. `sessionStorage` is no safer
against XSS — it's the same attacker capability.

OWASP ASVS V3.4: tokens must not be stored where untrusted scripts
can read them.

## ❌ Vulnerable

```ts
declare const localStorage: Storage;
declare const sessionStorage: Storage;

export function storeBad(token: string) {
  // ruleid: auth.jwt.localstorage
  localStorage.setItem('access_token', token);
}

export function storeBad2(refresh: string) {
  // ruleid: auth.jwt.localstorage
  localStorage.setItem('refresh_token', refresh);
}

export function storeBad3(jwtVal: string) {
  // ruleid: auth.jwt.localstorage
  localStorage['authToken'] = jwtVal;
}

export function storeBad4(token: string) {
  // ruleid: auth.jwt.localstorage
  window.localStorage.setItem('jwt', token);
}

export function storeBad5(token: string) {
  // ruleid: auth.jwt.localstorage -- sessionStorage is no safer against XSS
  sessionStorage.setItem('access_token', token);
}

const TOKEN_STORAGE_KEY = 'app.session';
export function storeBad6(token: string) {
  // ruleid: auth.jwt.localstorage -- key is a variable, but the value is the token
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}
```

## ✅ Safe

```ts
declare const localStorage: Storage;

// ok: auth.jwt.localstorage -- not auth-related
export function storeFontPref(font: string) {
  localStorage.setItem('font_preference', font);
}

// These keys contain auth-word substrings but are NOT token storage —
// they must not be flagged (regression guards for the substring FP).
export function storeUiPrefs(name: string, n: number) {
  // ok: auth.jwt.localstorage -- "author" contains "auth"
  localStorage.setItem('author_filter', name);
  // ok: auth.jwt.localstorage -- "auto_refresh" contains "refresh"
  localStorage.setItem('auto_refresh', 'true');
  // ok: auth.jwt.localstorage -- "access_count" contains "access"
  localStorage.setItem('access_count', String(n));
  // ok: auth.jwt.localstorage -- "session" UI flag, not a token
  localStorage.setItem('sidebar_session_collapsed', '1');
}

// ok: auth.jwt.localstorage -- tokens stay in memory, not localStorage
let inMemoryToken: string | null = null;
export function setToken(t: string) {
  inMemoryToken = t;
}
export function getToken() {
  return inMemoryToken;
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.jwt.localstorage -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
