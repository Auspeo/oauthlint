# `auth.flow.password-min-length`

> A password validation schema is enforcing a minimum length of less

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-005` |
| **Severity** | WARNING |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-521](https://cwe.mitre.org/data/definitions/521.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |
| **Technologies** | zod, joi, yup |

## Why this matters

A password validation schema is enforcing a minimum length of less
than 8 characters. NIST SP 800-63B recommends ≥ 8 characters for
user-chosen passwords (with NO mandatory complexity rules — length
is the dominant strength factor). OWASP ASVS V2.1.1 requires ≥ 12
for high-assurance applications.

Common LLM-generated mistake: `password: z.string().min(6)` because
"6 looks reasonable" — it isn't. Bump the floor to 8 minimum, 12
preferred.

## ❌ Vulnerable

```ts
import { z } from 'zod';

// ruleid: auth.flow.password-min-length
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ruleid: auth.flow.password-min-length
export const resetSchema = z.object({
  password: z.string().min(4),
  confirm: z.string(),
});

// ruleid: auth.flow.password-min-length -- custom-message form
export const customMsgSchema = z.object({
  password: z.string().min(6, 'Password too short'),
});
```

## ✅ Safe

```ts
import { z } from 'zod';

// ok: auth.flow.password-min-length
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

// ok: auth.flow.password-min-length
export const tightSchema = z.object({
  password: z.string().min(8).max(128),
});
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.password-min-length -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://pages.nist.gov/800-63-3/sp800-63b.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
