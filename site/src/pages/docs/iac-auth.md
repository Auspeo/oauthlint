---
layout: ../../layouts/DocsLayout.astro
title: "Scanning IaC auth"
description: "Scan the identity and OAuth config in your infrastructure as code: GitHub Actions OIDC trust policies, Terraform OAuth clients and callbacks, and hard-coded secrets in Terraform and CI workflows."
section: "iac-auth"
---

# Scanning IaC auth

The auth boundary does not live only in application code. It is also declared in the files that provision your identity: the AWS IAM trust policy that decides which GitHub repo can assume a role, the Terraform that stands up an OAuth client, the CI workflow that carries the deploy credentials. A wildcard in one of those files hands out access as surely as a missing check in a request handler, and AI coding tools generate this configuration as readily as they generate code.

OAuthLint scans that configuration for the same class of mistake it catches in code: OIDC trust that is too broad, deprecated OAuth grants, insecure redirect targets, and secrets pasted in cleartext. This is an auth-security pack, not a general IaC scanner: every rule is about identity, OAuth, or secrets.

```bash
npx oauthlint scan ./infra
```

The rules target Terraform (`.tf`), GitHub Actions workflows (`.yml` / `.yaml`), and AWS IAM trust policies (`.json`). Point OAuthLint at your infrastructure directory and it flags each issue with the fix.

## What the IaC-auth rule pack catches

Six rules ship across three config formats. Each maps to a CWE and carries a vulnerable and a safe example in the [rules catalogue](/rules) (search `iac` to see just this pack).

- **`auth.iac.gha-oidc-wildcard-sub`** (`AUTH-IAC-001`, error). An AWS IAM trust policy federates GitHub Actions OIDC but pins the `sub` claim to a wildcard (for example `repo:my-org/*:*`), so any repository or branch matching the glob can assume the role (CWE-284). Pin `sub` to an exact ref such as `repo:ORG/REPO:ref:refs/heads/main`. JSON.
- **`auth.iac.gha-oidc-missing-sub`** (`AUTH-IAC-002`, error). The same trust policy checks the `aud` claim but sets no `sub` condition at all, so ANY GitHub repository can assume the role: the audience is shared by every GitHub Actions token and does not identify your repo (CWE-284). Add a `sub` condition bound to your repository and ref. JSON.
- **`auth.iac.tf-oauth-implicit-grant`** (`AUTH-IAC-003`, error). A Terraform resource provisions an OAuth client with the implicit grant enabled (`grant_types` or `allowed_oauth_flows` contains `"implicit"`). The implicit flow returns tokens in the URL fragment with no client authentication and is removed from OAuth 2.1 and the security BCP (RFC 9700). Use `authorization_code` with PKCE (CWE-287). Terraform.
- **`auth.iac.tf-oauth-insecure-callback`** (`AUTH-IAC-004`, error). A Terraform OAuth resource registers a redirect/callback URL that is plaintext `http://` (off localhost) or uses a wildcard host, exposing the authorization code to interception or theft via any matching subdomain (open redirect, CWE-601). Register exact `https://` callbacks with fixed hosts. Terraform.
- **`auth.iac.ci-hardcoded-oauth-secret`** (`AUTH-IAC-005`, warning). A secret-like key (`client_secret`, `token`, `password`, `api_key`, ...) is assigned a hard-coded literal in a CI workflow instead of being read from the secret store (CWE-798). Reference it with `${{ secrets.NAME }}` or a masked variable. Committed secrets live in git history and build logs forever, so rotate them. YAML.
- **`auth.iac.tf-hardcoded-oauth-secret`** (`AUTH-IAC-006`, warning). A secret-like attribute is assigned a hard-coded string literal in Terraform. Because Terraform records arguments in state, the value leaks into both the repository and the state file (CWE-798). Read it from `var.*` or a secret-manager data source and keep it out of state. Terraform.

## A concrete example

The one that bites teams most is the wildcard OIDC trust, because the wildcard is the form you reach for when you want "all of my repos" to deploy and you have not yet felt the cost.

```json
{
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:my-org/*:*"
    }
  }
}
```

Any repository in `my-org`, on any branch or pull request, can assume this role. A single compromised or attacker-authored workflow in any of those repos gets your cloud credentials.

```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"
    }
  }
}
```

OAuthLint flags the first as `auth.iac.gha-oidc-wildcard-sub` and stays silent on the second. It also flags a policy that federates GitHub OIDC with only an `aud` condition and no `sub` at all, which is open to every repository on GitHub, as `auth.iac.gha-oidc-missing-sub`.

## Scope and false positives

These rules are deliberately narrow. The OIDC rules only match the GitHub Actions issuer (`token.actions.githubusercontent.com`), the OAuth rules match the attribute names the common providers use (Auth0, Cognito, Okta, generic OIDC clients), and the secret rules ignore values that are already indirected: `${{ secrets.* }}`, `var.*`, `env.*`, and URLs are not flagged. Local `http://localhost` and `http://127.0.0.1` callbacks are allowed so development configuration does not trip the callback rule.

Run just this pack with Semgrep, no install:

```bash
semgrep --config https://oauthlint.dev/r/oauthlint-terraform.yaml ./infra
semgrep --config https://oauthlint.dev/r/oauthlint-yaml.yaml ./.github/workflows
semgrep --config https://oauthlint.dev/r/oauthlint-json.yaml ./infra
```
