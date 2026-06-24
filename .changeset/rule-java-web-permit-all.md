---
'oauthlint-rules': minor
---

Add `auth.java.web.permit-all` (AUTH-JAVA-WEB-002, CWE-862). Flags Spring
Security configurations that authorize every request without authentication
via `anyRequest().permitAll()` — both the Spring Security 6 lambda DSL
(`authorizeHttpRequests(auth -> auth.anyRequest().permitAll())`) and the legacy
fluent chains (`authorizeHttpRequests().anyRequest().permitAll()`,
`authorizeRequests().anyRequest().permitAll()`). Because `anyRequest()` is the
catch-all matcher, this makes the entire application publicly reachable (broken
access control). Targets only the catch-all `anyRequest().permitAll()`; never
flags `permitAll()` on specific matchers such as
`requestMatchers("/public/**").permitAll()`, which are legitimate.
