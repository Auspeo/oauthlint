---
'oauthlint-rules': minor
---

Add `auth.flow.secret-in-log` (AUTH-FLOW-008, CWE-532). Flags secret-shaped
identifiers (`password`, `token`, `secret`, `apiKey`, `accessToken`,
`refreshToken`, `privateKey`, `clientSecret`, …) passed to a logging call —
`console.log/info/debug/warn/error(...)` or `logger.<level>(...)` — including
when the secret is at any argument position or interpolated into a template
literal (`console.log(\`token=${token}\`)`). Logs leak to files and
aggregators, so this is a textbook credential disclosure. To keep false
positives low the rule only fires on bare secret-named identifiers: string
literals (`console.log('password updated')`, `console.log('reset token sent')`),
non-secret member access (`console.log(user.id)`) and plain status text
(`console.log('login ok')`) are not flagged.
