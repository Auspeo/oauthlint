# `auth.java.cookie.insecure`

> A servlet Cookie is created with a security attribute explicitly

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-COOKIE-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-614](https://cwe.mitre.org/data/definitions/614.html) |
| **OWASP** | A05:2021 |
| **Languages** | java |
| **Technologies** | servlet |

## Why this matters

A servlet Cookie is created with a security attribute explicitly
disabled. `setSecure(false)` lets the cookie travel over plain HTTP,
and `setHttpOnly(false)` makes it readable from JavaScript — either way
a session or auth cookie can be intercepted or stolen (CWE-614). This is
a common AI-generated mistake where the flag is set to `false` to "make
it work" over localhost and never switched back.

Set `cookie.setSecure(true)` and `cookie.setHttpOnly(true)` on every
session or authentication cookie, and add `SameSite` (e.g. `Strict` or
`Lax`) to further limit cross-site exposure.

## ❌ Vulnerable

```java
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

class CookieConfig {

    void loginSession(HttpServletResponse response) {
        Cookie session = new Cookie("SESSION", "abc123");
        // ruleid: auth.java.cookie.insecure
        session.setSecure(false);
        response.addCookie(session);
    }

    void authToken(HttpServletResponse response) {
        Cookie auth = new Cookie("AUTH_TOKEN", "tok");
        // ruleid: auth.java.cookie.insecure
        auth.setHttpOnly(false);
        response.addCookie(auth);
    }

    void refreshCookie(HttpServletResponse response) {
        Cookie refresh = new Cookie("REFRESH", "r");
        // ruleid: auth.java.cookie.insecure
        refresh.setSecure(false);
        refresh.setHttpOnly(true);
        response.addCookie(refresh);
    }
}
```

## ✅ Safe

```java
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

class SafeCookieConfig {

    void loginSession(HttpServletResponse response) {
        Cookie cookie = new Cookie("SESSION", "abc123");
        // ok: auth.java.cookie.insecure
        cookie.setSecure(true);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }

    void noFlags(HttpServletResponse response) {
        Cookie cookie = new Cookie("PREFS", "dark");
        // ok: auth.java.cookie.insecure
        response.addCookie(cookie);
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.cookie.insecure -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://owasp.org/www-community/controls/SecureCookieAttribute
- https://cwe.mitre.org/data/definitions/614.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
