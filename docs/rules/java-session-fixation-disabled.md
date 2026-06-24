# `auth.java.session.fixation-disabled`

> Spring Security session fixation protection is disabled via

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-SESSION-001` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-384](https://cwe.mitre.org/data/definitions/384.html) |
| **OWASP** | A07:2021 |
| **Languages** | java |
| **Technologies** | spring-security |

## Why this matters

Spring Security session fixation protection is disabled via
`sessionFixation().none()`. With `none()`, the session ID is NOT
regenerated when a user authenticates, so an attacker who fixes the
victim's session ID before login (e.g. by planting a cookie) keeps a
valid session and hijacks the authenticated account (CWE-384).

Leave the default (`changeSessionId`) in place, or use `migrateSession()`
to copy the existing session attributes into a new session ID. Never use
`none()`.

## ❌ Vulnerable

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.session.fixation-disabled
        http.sessionManagement().sessionFixation().none();
        return http.build();
    }

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.session.fixation-disabled
        http.sessionManagement(session -> session.sessionFixation(fixation -> fixation.none()));
        return http.build();
    }
}
```

## ✅ Safe

```java
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfigSafe {

    // ok: auth.java.session.fixation-disabled -- session ID regenerated on login
    SecurityFilterChain changeId(HttpSecurity http) throws Exception {
        http.sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()));
        return http.build();
    }

    // ok: auth.java.session.fixation-disabled -- attributes migrated to a new session
    SecurityFilterChain migrate(HttpSecurity http) throws Exception {
        http.sessionManagement().sessionFixation().migrateSession();
        return http.build();
    }

    // ok: auth.java.session.fixation-disabled -- no session fixation config (default applies)
    SecurityFilterChain defaults(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.session.fixation-disabled -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html
- https://cwe.mitre.org/data/definitions/384.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
