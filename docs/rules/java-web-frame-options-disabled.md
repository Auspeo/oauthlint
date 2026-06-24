# `auth.java.web.frame-options-disabled`

> Spring Security's `X-Frame-Options` header is disabled. This header is

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-WEB-003` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-1021](https://cwe.mitre.org/data/definitions/1021.html) |
| **OWASP** | A05:2021 |
| **Languages** | java |
| **Technologies** | spring-security |

## Why this matters

Spring Security's `X-Frame-Options` header is disabled. This header is
the browser's clickjacking defense — with it off, an attacker can embed
the application in a hidden `<iframe>` on a malicious page and trick a
logged-in victim into clicking UI elements they cannot see (CWE-1021).

Keep `X-Frame-Options` set to DENY or SAMEORIGIN — e.g.
`frameOptions(f -> f.sameOrigin())` or `frameOptions(f -> f.deny())`. If
you need to allow framing from a specific set of origins, use a Content
Security Policy `frame-ancestors` directive instead of disabling the
protection outright.

## ❌ Vulnerable

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain fluent(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.frame-options-disabled
        http.headers().frameOptions().disable();
        return http.build();
    }

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.frame-options-disabled
        http.headers(h -> h.frameOptions(f -> f.disable()));
        return http.build();
    }

    SecurityFilterChain methodRef(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.frame-options-disabled
        http.headers(h -> h.frameOptions(FrameOptionsConfig::disable));
        return http.build();
    }
}
```

## ✅ Safe

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfigSafe {

    // ok: auth.java.web.frame-options-disabled -- frame options left at default (DENY)
    SecurityFilterChain defaults(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    // ok: auth.java.web.frame-options-disabled -- explicitly kept on with SAMEORIGIN
    SecurityFilterChain sameOrigin(HttpSecurity http) throws Exception {
        http.headers(h -> h.frameOptions(f -> f.sameOrigin()));
        return http.build();
    }

    // ok: auth.java.web.frame-options-disabled -- explicitly kept on with DENY
    SecurityFilterChain deny(HttpSecurity http) throws Exception {
        http.headers(h -> h.frameOptions(f -> f.deny()));
        return http.build();
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.web.frame-options-disabled -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html
- https://cwe.mitre.org/data/definitions/1021.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
