---
'oauthlint-rules': minor
---

Add `auth.java.cors.allow-all` (AUTH-JAVA-CORS-001, CWE-942). Flags Spring CORS
configurations that allow every origin via the wildcard `*`: the
`@CrossOrigin(origins = "*")` annotation, its value alias `@CrossOrigin("*")`,
a bare `@CrossOrigin` on a handler method (defaults to all origins), and the
programmatic `CorsConfiguration` API — `addAllowedOrigin("*")` and
`setAllowedOrigins(...)` with a list literal containing `"*"` (`List.of("*")`,
`Arrays.asList("*")`, ...). Allowing all origins defeats the same-origin policy
and, combined with credentials, becomes an account-takeover primitive. Only the
literal `"*"` is matched — explicit origins such as
`"https://app.example.com"` are not flagged.
