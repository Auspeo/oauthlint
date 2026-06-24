---
'oauthlint-rules': minor
---

Add `auth.java.session.fixation-disabled` (AUTH-JAVA-SESSION-001, CWE-384).
Flags Spring Security configurations that disable session fixation protection
via `sessionFixation().none()` — both the legacy fluent form
(`sessionManagement().sessionFixation().none()`) and the Spring Security 6
lambda DSL (`sessionManagement(s -> s.sessionFixation(f -> f.none()))`). With
`none()`, the session ID is not regenerated on authentication, so an attacker
who fixes the session ID before login can hijack the authenticated session
(session fixation, A07:2021). Targets only `none()`; never flags the safe
alternatives `changeSessionId()` (the default) or `migrateSession()`.
