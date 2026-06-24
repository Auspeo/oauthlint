# `auth.java.web.permit-all`

> Spring Security authorizes every request without authentication via

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-WEB-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-862](https://cwe.mitre.org/data/definitions/862.html) |
| **OWASP** | A01:2021 |
| **Languages** | java |
| **Technologies** | spring-security |

## Why this matters

Spring Security authorizes every request without authentication via
`anyRequest().permitAll()`. Because `anyRequest()` is the catch-all
matcher, this makes the entire application publicly accessible — any
endpoint, including state-changing and sensitive ones, can be reached
without a logged-in user (CWE-862, broken access control). This is a
common AI-generated Spring mistake: the default-allow line is pasted in
to "make it work" and the intended access rules are never added.

Require authentication by default with `anyRequest().authenticated()`,
and open only the specific public routes explicitly, e.g.
`requestMatchers("/public/**").permitAll()`. Granting `permitAll()` on a
specific matcher is fine; granting it on `anyRequest()` is not.

## ❌ Vulnerable

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    SecurityFilterChain fluent(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all
        http.authorizeHttpRequests().anyRequest().permitAll();
        return http.build();
    }

    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all
        http.authorizeRequests().anyRequest().permitAll();
        return http.build();
    }
}
```

## ✅ Safe

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain secured(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    SecurityFilterChain publicRoutesThenAuth(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/public/**").permitAll()
            .requestMatchers("/login").permitAll()
            .anyRequest().authenticated());
        return http.build();
    }

    SecurityFilterChain fluentSecured(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all
        http.authorizeHttpRequests()
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated();
        return http.build();
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.web.permit-all -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html
- https://cwe.mitre.org/data/definitions/862.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
