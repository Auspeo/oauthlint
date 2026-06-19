# `auth.secret.provider-key`

> A hard-coded credential matching a well-known provider's key format

| | |
|---|---|
| **OAuthLint id** | `AUTH-SECRET-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API8:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A hard-coded credential matching a well-known provider's key format
was found in the source. These keys are designed to be revocable —
once one ships to git, the only safe action is to rotate it, even
if the repo is private.

Move the value to an environment variable, a secret manager (AWS
Secrets Manager, GCP Secret Manager, Doppler, 1Password CLI),
or a `.env` file that's `.gitignore`d.

Detected formats:
  - Stripe live / test:  sk_live_…  / sk_test_…   / pk_live_…
  - OpenAI:              sk-…  /  sk-proj-…
  - Anthropic:           sk-ant-…
  - GitHub:              ghp_… / gho_… / ghu_… / ghs_… / ghr_…
  - Google Workspace:    GOCSPX-…
  - AWS Access Key:      AKIA[0-9A-Z]{16}
  - Slack Bot / User:    xoxb-… / xoxp-…

## ❌ Vulnerable

```ts
// ruleid: auth.secret.provider-key
export const stripe = 'sk_live_4eC39HqLyjWDarjtT1zdp7dc';

// ruleid: auth.secret.provider-key
export const openai = 'sk-proj-abcdefghijklmnop0123456789';

// ruleid: auth.secret.provider-key
export const githubPat = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789';

// ruleid: auth.secret.provider-key
export const google = 'GOCSPX-aaaaaaaaaaaaaaaaaaaaaaaaa';

// ruleid: auth.secret.provider-key
export const aws = 'AKIAIOSFODNN7EXAMPLE';

// ruleid: auth.secret.provider-key
export const slack = 'xoxb-1234567890-1234567890-abcdefghijklmnopqrstuvwx';
```

## ✅ Safe

```ts
// ok: auth.secret.provider-key
export const stripe = process.env.STRIPE_SECRET_KEY!;

// ok: auth.secret.provider-key
export const openai = process.env.OPENAI_API_KEY!;

// ok: auth.secret.provider-key
export const github = process.env.GITHUB_TOKEN!;
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.secret.provider-key -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/
- https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/

---

*This page is generated from `packages/oauthlint-rules/rules/` and the fixture pair. Edit those files, not this one — re-run `pnpm docs:rules` to refresh.*
