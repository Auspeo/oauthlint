# `auth.java.web.csrf-disabled`

> Spring Security CSRF protection is disabled. With CSRF off, an attacker

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-WEB-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-352](https://cwe.mitre.org/data/definitions/352.html) |
| **OWASP** | A01:2021 |
| **Languages** | java |
| **Technologies** | spring-security |

## Why this matters

Spring Security CSRF protection is disabled. With CSRF off, an attacker
can forge state-changing requests that a logged-in victim's browser
submits with their session cookie (CWE-352). This is one of the most
common AI-generated Spring mistakes — `csrf().disable()` is pasted in to
"make the API work" and never removed.

Keep CSRF protection enabled. For a stateless API authenticated with
bearer tokens (not cookies), scope it instead — e.g. ignore specific
paths or use a `CookieCsrfTokenRepository` — rather than disabling it
globally.

## ❌ Vulnerable

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.csrf-disabled
        http.csrf().disable();
        return http.build();
    }

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.csrf-disabled
        http.csrf(csrf -> csrf.disable());
        return http.build();
    }

    SecurityFilterChain methodRef(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.csrf-disabled
        http.csrf(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
```

## ✅ Safe

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

class SecurityConfigSafe {

    // ok: auth.java.web.csrf-disabled -- CSRF left enabled (default)
    SecurityFilterChain enabled(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    // ok: auth.java.web.csrf-disabled -- CSRF kept on with a cookie token repository
    SecurityFilterChain cookieRepo(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));
        return http.build();
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.web.csrf-disabled -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html
- https://cwe.mitre.org/data/definitions/352.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
