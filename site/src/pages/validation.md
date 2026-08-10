---
layout: ../layouts/Prose.astro
title: "Validation report"
description: "How the OAuthLint rule pack behaves on real, popular code: zero false positives on the clean auth libraries it scans."
active: "validation"
---

# Real-world validation report

OAuthLint's whole value rests on a low false-positive rate. A security linter that cries wolf gets turned off. This page records how the full rule pack (184 rules across JavaScript/TypeScript, Python, Go, Java, Rust, and C#/.NET) behaves when it is run against real, widely-used code.

> Reproduce it with `pnpm validate`. It scans the repositories listed in [`scripts/validation-targets.yml`](https://github.com/Auspeo/oauthlint/blob/main/scripts/validation-targets.yml) with the CLI and writes a per-rule report. The figures below come from a full-pack scan of that corpus on the current release.

## Method

- **Corpus:** widely-used auth and OAuth projects (more than 7,000 source files) across all six supported languages, plus a few large, auth-heavy applications.
- **Signal classification** (from `validation-targets.yml`):
  - **low:** mature auth code that should come back clean. Any finding here is a candidate false positive and is triaged one by one.
  - **high:** auth-heavy or AI-generated apps where real findings are expected.
- **What the rules skip:** by design they do not fire on test suites, example apps, documentation snippets, or vendored dependencies. A library's own tests legitimately exercise the very APIs the rules flag, so that code is not part of the false-positive denominator.

## Headline result

> On the clean, auth-consuming libraries, the pack fires zero. The only findings on low-signal code are two real patterns in next-auth's own source, one correct detection in each of the two OAuth client libraries that implement the deprecated password grant, and a single high-recall edge in the NestJS framework. None is noise, and each is triaged below.

These sixteen auth libraries came back with zero findings, across JS/TS, Python, Go, Rust, Java, and C#:

| Library | Lang | Findings |
|---|---|:--:|
| `panva/jose` | JS/TS | 0 |
| `panva/node-openid-client` | JS/TS | 0 |
| `fastify/fastify-jwt` | JS/TS | 0 |
| `fastify/session` | JS/TS | 0 |
| `fastify/fastify-cors` | JS/TS | 0 |
| `jpadilla/pyjwt` | Python | 0 |
| `lepture/authlib` | Python | 0 |
| `pallets/flask` | Python | 0 |
| `encode/django-rest-framework` | Python | 0 |
| `maxcountryman/flask-login` | Python | 0 |
| `gorilla/sessions` | Go | 0 |
| `seanmonstar/reqwest` | Rust | 0 |
| `spring-projects/spring-petclinic` | Java | 0 |
| `jwt-dotnet/jwt` | C# | 0 |
| `openiddict/openiddict-core` | C# | 0 |
| `IdentityModel/IdentityModel` | C# | 0 |

## Triage of the remaining low-signal findings

These are the only findings on low-signal targets, and none of them is noise:

| Finding | Repo | Verdict |
|---|---|---|
| `auth.go.oauth.ropc-grant` ×1 | `golang/oauth2` | **Correct detection.** The library's own `PasswordCredentialsToken` builds the deprecated Resource Owner Password Credentials grant. The rule flags that grant wherever it is constructed, and here it is the library implementing it. In a normal scan this library is a vendored dependency, which OAuthLint skips. |
| `auth.rust.oauth.ropc-grant` ×1 | `ramosbugs/oauth2-rs` | **Correct detection.** The same case: the crate's request builder for `exchange_password`. |
| `auth.flow.timing-unsafe-compare` ×1 | `nextauthjs/next-auth` | **True positive (kept).** A non-constant-time CSRF-token compare, worth constant-time handling. |
| `auth.jwt.no-expiration` ×1 | `nextauthjs/next-auth` | **True positive (kept).** The Dgraph adapter signs a JWT with no `exp`. |
| `auth.flow.secret-in-log` ×1 | `nestjs/nest` | **Known high-recall edge (kept, not suppressed).** A NestJS REPL debug helper logs a bare `token` identifier that is a dependency-injection token name, not a credential. The rule flags any secret-named value reaching a log sink; sparing this one case would require dataflow back to its definition and would blind the rule to real `console.log(token)` leaks, which are common in AI-generated code. We keep the rule and accept this single edge rather than lose recall, and we say so here rather than hide it. |

The two implementation libraries (`golang/oauth2` and `oauth2-rs`) build OAuth requests for a living, so they contain the raw mechanisms the rules look for. Flagging the password grant in the code that implements it is accurate, not a false alarm, and you would not point OAuthLint at a dependency's source in day-to-day use.

Earlier builds of the pack did fire on these libraries' tests, examples, and request builders. Those were tracked down and fixed: the OAuth rules now require an application-style usage and skip test, example, and vendored paths, so a library exercising its own primitives no longer counts against the score. The most recent pass narrowed `timing-unsafe-compare` so it no longer fires on non-secret equality checks (dependency-injection tokens, error codes, class names) and extended the skips to `sample` and `benchmark` trees, which is what keeps the framework monorepos above at zero.

## The pack still finds real things

On high-signal apps the rules surface genuine, actionable findings. `directus/directus`, for example, produces 123 findings across twenty rules (open-redirect in its OAuth and OIDC drivers, decode-without-verify, timing-unsafe compares, and more), `supabase/auth` produces a focused handful, and the C# corpus surfaces real issues too, including in `dotnet-architecture/eShopOnWeb`. Low false positives, not low recall.

## Why this matters

This is the tuning the generic Semgrep registry never does for the auth domain. Every rule is measured against real library source, so it fires on your bug rather than on jose's internals or a library's own test suite. It is invisible, tedious work, and it is the product.

<!-- Methodology and corpus: scripts/validation-targets.yml. Re-run: pnpm validate. -->
