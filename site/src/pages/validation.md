---
layout: ../layouts/Prose.astro
title: "Validation report"
description: "How the OAuthLint rule pack behaves on real, popular code: zero false positives on the clean auth libraries it scans."
active: "validation"
---

# Real-world validation report

OAuthLint's whole value rests on a low false-positive rate. A security linter that cries wolf gets turned off. This page records how the full rule pack (165 rules across JavaScript/TypeScript, Python, Go, Java, and Rust) behaves when it is run against real, widely-used code.

> Reproduce it with `pnpm validate`. It scans the repositories listed in [`scripts/validation-targets.yml`](https://github.com/Auspeo/oauthlint/blob/main/scripts/validation-targets.yml) with the CLI and writes a per-rule report. The figures below come from a full-pack scan of that corpus on the current release.

## Method

- **Corpus:** widely-used auth and OAuth projects (more than 4,000 source files) across all five supported languages, plus a few large, auth-heavy applications.
- **Signal classification** (from `validation-targets.yml`):
  - **low:** mature auth code that should come back clean. Any finding here is a candidate false positive and is triaged one by one.
  - **high:** auth-heavy or AI-generated apps where real findings are expected.
- **What the rules skip:** by design they do not fire on test suites, example apps, documentation snippets, or vendored dependencies. A library's own tests legitimately exercise the very APIs the rules flag, so that code is not part of the false-positive denominator.

## Headline result

> On the clean, auth-consuming libraries, the pack fires zero. The only findings on low-signal code are two real, low-severity patterns in next-auth's own source, plus one correct detection in each of the two OAuth client libraries that implement the deprecated password grant.

These eight auth libraries came back with zero findings, across JS/TS, Python, Go, Rust, and Java:

| Library | Lang | Findings |
|---|---|:--:|
| `panva/jose` | JS/TS | 0 |
| `panva/node-openid-client` | JS/TS | 0 |
| `jpadilla/pyjwt` | Python | 0 |
| `lepture/authlib` | Python | 0 |
| `pallets/flask` | Python | 0 |
| `gorilla/sessions` | Go | 0 |
| `seanmonstar/reqwest` | Rust | 0 |
| `spring-projects/spring-petclinic` | Java | 0 |

## Triage of the remaining low-signal findings

These are the only findings on low-signal targets, and none of them is noise:

| Finding | Repo | Verdict |
|---|---|---|
| `auth.go.oauth.ropc-grant` ×1 | `golang/oauth2` | **Correct detection.** The library's own `PasswordCredentialsToken` builds the deprecated Resource Owner Password Credentials grant. The rule flags that grant wherever it is constructed, and here it is the library implementing it. In a normal scan this library is a vendored dependency, which OAuthLint skips. |
| `auth.rust.oauth.ropc-grant` ×1 | `ramosbugs/oauth2-rs` | **Correct detection.** The same case: the crate's request builder for `exchange_password`. |
| `auth.flow.timing-unsafe-compare` ×1 | `nextauthjs/next-auth` | **True positive (kept).** A non-constant-time CSRF-token compare, worth constant-time handling. |
| `auth.jwt.no-expiration` ×1 | `nextauthjs/next-auth` | **True positive (kept).** The Dgraph adapter signs a JWT with no `exp`. |

The two implementation libraries (`golang/oauth2` and `oauth2-rs`) build OAuth requests for a living, so they contain the raw mechanisms the rules look for. Flagging the password grant in the code that implements it is accurate, not a false alarm, and you would not point OAuthLint at a dependency's source in day-to-day use.

Earlier builds of the pack did fire on these libraries' tests, examples, and request builders. Those were tracked down and fixed: the OAuth rules now require an application-style usage and skip test, example, and vendored paths, so a library exercising its own primitives no longer counts against the score.

## The pack still finds real things

On high-signal apps the rules surface genuine, actionable findings. `directus/directus`, for example, produces well over a hundred across twenty rules (open-redirect in its OAuth and OIDC drivers, decode-without-verify, timing-unsafe compares, and more), and `supabase/auth` produces a focused handful. Low false positives, not low recall.

## Why this matters

This is the tuning the generic Semgrep registry never does for the auth domain. Every rule is measured against real library source, so it fires on your bug rather than on jose's internals or a library's own test suite. It is invisible, tedious work, and it is the product.

<!-- Methodology and corpus: scripts/validation-targets.yml. Re-run: pnpm validate. -->
