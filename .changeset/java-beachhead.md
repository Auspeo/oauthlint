---
'oauthlint-rules': minor
---

feat(rules): Java rule packs. The language-aware infrastructure now also covers
Java — `.java` fixtures, `auth.java.<category>.<name>` ids, and `java` doc
fences — with zero change to existing JS/TS, Python, or Go rules. Ships the
first Java rule, `auth.java.web.csrf-disabled` (Spring Security
`csrf().disable()`, CWE-352).
