---
layout: ../../layouts/DocsLayout.astro
title: "Suppressing rules"
description: "Silence a single finding with an auditable inline comment (naming the rule and, ideally, the reason) when you've made a deliberate, documented exception."
section: "suppressing"
---

# Suppressing rules

When a finding is a deliberate exception, silence that one line with an inline comment that names the rule, so the next reviewer sees exactly what opted out, and why.

## Inline syntax

Put a comment on (or just above) the offending line. OAuthLint scans the source text for its directive anywhere in a line, so use whatever comment style the language already uses:

```ts
// oauthlint-disable-next-line auth.jwt.alg-none -- legacy token from partner API, removed in Q3
return jwt.verify(token, key, { algorithms: ['RS256', 'none'] });
```

```py
# oauthlint-disable-next-line auth.session.insecure-cookie -- dev-only HTTP origin, never deployed
response.set_cookie("sid", sid, secure=False)
```

There are three directives:

- `oauthlint-disable-next-line <rule-id> [-- <reason>]` suppresses the rule on the **following** line. This is the one to reach for.
- `oauthlint-disable-line <rule-id> [-- <reason>]` suppresses the rule on the **same** line the comment sits on.
- `oauthlint-disable-file <rule-id> [-- <reason>]` suppresses one specific rule for the **entire file**. It can go anywhere in the file. Use this sparingly; a next-line comment at the exact site is almost always clearer.

## The rule id is required; the reason is encouraged

The `<rule-id>` is **mandatory**. A directive without one is ignored; there is no "disable everything on this line" form. Use the exact id from the finding (e.g. `auth.jwt.alg-none`); browse them in the [rules catalogue](/rules).

The `-- <reason>` is **optional but strongly encouraged**. The parser accepts a bare `// oauthlint-disable-next-line auth.jwt.alg-none`, but a suppression with no reason is an unexplained hole. Treat the reason as an audit trail: it tells the next reviewer this was a decision, not an oversight, and when it expires.

For `disable-next-line` and `disable-line` you may use `*` as the rule id to suppress **every** rule on that single line. That still requires an explicit, line-by-line decision, which is exactly the point.

## What's intentionally unsupported

There is **no blanket file-level silencing**. `oauthlint-disable-file *` is recognised by the parser and then deliberately discarded; a wildcard disable for a whole file does nothing.

The rationale: a file-wide `*` would silently hide *future* findings as the file grows and as the rule set expands. A reviewer reading the file later would have no signal that anything was suppressed, let alone what or why. By requiring a rule id on every directive, and refusing the wildcard at file scope, OAuthLint guarantees that every suppression is a visible, named, attributable decision at or near the line it affects.

(`oauthlint-disable-file <rule-id>` with a concrete id is supported, because it still names exactly what was turned off.)

## Use it deliberately

- **Prefer the fix.** Most findings have a one-line safe replacement on the [rules catalogue](/rules) and in the finding itself. Suppressing is for the genuine exception, not the inconvenient one.
- **Suppress the narrowest scope.** A `disable-next-line` on the exact line beats `disable-file`; a named rule id beats `*`.
- **Always write the reason.** It's the difference between an exception and a liability at the next review.

In VS Code, the **Quick Fix** on a diagnostic can insert one of these comments for you. See the [VS Code extension](/docs/vscode) page. To see what suppressions did and didn't fire across a run, use the [CLI](/docs/cli).
