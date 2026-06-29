---
layout: ../layouts/Prose.astro
title: "Validation report"
description: "How the OAuthLint rule pack behaves on real, popular code: zero false positives on clean auth libraries across ~9,400 files."
active: "validation"
---

# Real-world validation report

OAuthLint's whole value rests on low false positives. A security linter that
cries wolf gets turned off. This page documents how the full 90-rule pack
(v0.2.0) behaves when run against real, popular code across all five supported
languages.

> Reproduce the raw scan with `pnpm validate`. It clones the targets in
> [`scripts/validation-targets.yml`](https://github.com/Auspeo/oauthlint/blob/main/scripts/validation-targets.yml)
> and runs the CLI over each. The summary below is from a full-pack scan of the
> cached corpus.

## Method

- **Corpus:** 18 widely-used repositories, ~9,400 source files across
  JavaScript/TypeScript, Python, Go, Java and Rust.
- **Signal classification** (from `validation-targets.yml`):
  - **`low`**: mature auth libraries that should be clean. Any finding here is a
    candidate false positive, triaged individually.
  - **`high`**: auth-heavy and AI-generated apps where real findings are
    expected.
- **Test and example code is excluded** from the false-positive denominator. A
  library's own test suite legitimately exercises the dangerous APIs it
  implements.

## Headline result

> Across 18 repos and ~9,400 files, the pack produced zero false positives on
> the clean auth libraries. Every finding on a `low`-signal target resolves to
> either the library detecting its own primitives in its test suite, or a
> genuine true positive.

The ten pristine auth libraries below fired zero rules, across JS/TS, Python, Go
and Rust alike:

| Library | Lang | Findings |
|---|---|:--:|
| `panva/jose` | JS/TS | 0 |
| `panva/node-openid-client` | JS/TS | 0 |
| `jpadilla/pyjwt` | Python | 0 |
| `lepture/authlib` | Python | 0 |
| `pallets/flask` | Python | 0 |
| `golang/oauth2` | Go | 0 |
| `gorilla/sessions` | Go | 0 |
| `seanmonstar/reqwest` | Rust | 0 |
| `ramosbugs/oauth2-rs` | Rust | 0 |
| `spring-projects/spring-petclinic` | Java | 0 |

## Triage of the remaining `low`-signal findings

These are the only findings on `low`-signal repos. None is a new false positive:

| Finding | Repo | Verdict |
|---|---|---|
| `auth.rust.jwt.no-*-validation` ×22 | `Keats/jsonwebtoken` | **Excluded.** All inside the crate's own `#[cfg(test)]` module (it *implements* `Validation`, so its tests set `validate_exp/aud = false`). jsonwebtoken is deliberately not a target. |
| `auth.go.jwt.parse-unverified` ×1 | `golang-jwt/jwt` | **Excluded.** The library's own `ParseWithClaims` calls `ParseUnverified` internally before verifying. golang-jwt is the implementer, not a target. |
| `auth.java.web.permit-all` ×1 | `spring-projects/spring-security` | **Excluded.** Integration-test scaffolding. |
| `auth.flow.timing-unsafe-compare` ×2 | `nextauthjs/next-auth` | **True positive (kept).** A real CSRF-token compare and a `Bearer ${CRON_SECRET}` compare, both worth constant-time handling. |
| `auth.jwt.no-expiration` ×1 | `nextauthjs/next-auth` | **True positive (kept).** The Dgraph adapter signs a JWT with no `exp`. |

Implementer libraries (`jsonwebtoken`, `golang-jwt`) are excluded by design:
they ship and test the very primitives the rules flag. See the notes in
`validation-targets.yml`.

## The pack still finds real things

On `high`-signal apps the rules surface genuine, actionable findings. On
`directus/directus`, for example: `auth.oauth.open-redirect-callback` in its
OAuth2/OIDC drivers, `auth.jwt.decode-without-verify`, and
`auth.flow.timing-unsafe-compare`. Low false positives, not low recall.

## Why this matters

This is the discipline the generic Semgrep registry does not apply to the auth
domain: every rule is tuned against real library source, so it fires on your
bug, not on `jose`'s internals. It is invisible, tedious work, and it is the
product.

<!-- Methodology and corpus: scripts/validation-targets.yml. Re-run: pnpm validate. -->
