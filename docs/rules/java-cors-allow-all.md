# `auth.java.cors.allow-all`

> CORS is configured to allow every origin with the wildcard `*`. Any

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-CORS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-942](https://cwe.mitre.org/data/definitions/942.html) |
| **OWASP** | A05:2021 |
| **Languages** | java |
| **Technologies** | spring-web |

## Why this matters

CORS is configured to allow every origin with the wildcard `*`. Any
website can then make cross-origin requests to this endpoint, defeating
the same-origin policy (CWE-942). This is a common AI-generated Spring
mistake — `@CrossOrigin(origins = "*")` or `addAllowedOrigin("*")` is
pasted in to "make the browser call work" and the intended scope is
never added. A bare `@CrossOrigin` (no arguments) also defaults to all
origins.

Restrict CORS to an explicit allowlist of trusted origins instead, e.g.
`@CrossOrigin(origins = "https://app.example.com")` or
`config.setAllowedOrigins(List.of("https://app.example.com"))`. Note that
`addAllowedOriginPattern("*")` combined with `setAllowCredentials(true)`
is just as dangerous, because it sends the victim's cookies cross-origin.

## ❌ Vulnerable

```java
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;

@RestController
class CorsControllerVulnerable {

    // ruleid: auth.java.cors.allow-all
    @CrossOrigin(origins = "*")
    @GetMapping("/explicit")
    String explicit() {
        return "open";
    }

    // ruleid: auth.java.cors.allow-all
    @CrossOrigin
    @GetMapping("/bare")
    String bare() {
        return "open";
    }

    CorsConfiguration addAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ruleid: auth.java.cors.allow-all
        config.addAllowedOrigin("*");
        return config;
    }

    CorsConfiguration setAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ruleid: auth.java.cors.allow-all
        config.setAllowedOrigins(List.of("*"));
        return config;
    }
}
```

## ✅ Safe

```java
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;

@RestController
class CorsControllerSafe {

    // ok: auth.java.cors.allow-all -- explicit trusted origin, not a wildcard
    @CrossOrigin(origins = "https://app.example.com")
    @GetMapping("/scoped")
    String scoped() {
        return "ok";
    }

    CorsConfiguration addAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ok: auth.java.cors.allow-all -- explicit trusted origin
        config.addAllowedOrigin("https://app.example.com");
        return config;
    }

    CorsConfiguration setAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ok: auth.java.cors.allow-all -- allowlist of explicit origins
        config.setAllowedOrigins(Arrays.asList("https://app.example.com", "https://admin.example.com"));
        return config;
    }

    CorsConfiguration setAllowedSingle() {
        CorsConfiguration config = new CorsConfiguration();
        // ok: auth.java.cors.allow-all -- single explicit origin
        config.setAllowedOrigins(List.of("https://app.example.com"));
        return config;
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.cors.allow-all -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html
- https://cwe.mitre.org/data/definitions/942.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
