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
```

## ✅ Safe

```ts
declare const localStorage: Storage;

// ok: auth.jwt.localstorage -- not auth-related
export function storeFontPref(font: string) {
  localStorage.setItem('font_preference', font);
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

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
