---
'oauthlint-rules': minor
---

Add `auth.java.web.frame-options-disabled` (AUTH-JAVA-WEB-003, CWE-1021). Flags
Spring Security configurations that disable the `X-Frame-Options` clickjacking
header — the legacy fluent form (`http.headers().frameOptions().disable()`), the
Spring Security 6 lambda DSL (`http.headers(h -> h.frameOptions(f -> f.disable()))`),
and the method reference (`frameOptions(FrameOptionsConfig::disable)`). With the
header off, an attacker can frame the application in a hidden `<iframe>` and
trick a logged-in victim into clicking invisible UI. Only the `disable` terminal
is flagged; legitimate `frameOptions(f -> f.sameOrigin())` and
`frameOptions(f -> f.deny())` configurations are never flagged.
