# Releasing oauthlint

The repo publishes two npm packages plus two marketplace artifacts:

| Artifact | Registry | Source |
|---|---|---|
| `oauthlint-rules` | npm (public) | `rules/` |
| `oauthlint` (CLI) | npm (public) | `cli/` |
| `oauthlint` Action | GitHub Marketplace | `action/` (Docker) |
| oauthlint VS Code extension | VS Code Marketplace + OpenVSX | `vscode/` |

> **Publish with pnpm, not npm.** The CLI depends on `oauthlint-rules` via
> `workspace:*`; `pnpm publish` / `pnpm changeset publish` rewrites that to the
> real version (`0.1.0`). Raw `npm publish` would ship the `workspace:*` literal.

## One-time prerequisites

- [ ] npm account/org that owns `oauthlint` + `oauthlint-rules`; `npm login` locally (or set `NPM_TOKEN` in CI).
- [ ] `oauthlint.dev` (+ `.com`) registered; DNS ready (Cloudflare).
- [ ] VS Code Marketplace publisher `auspeo` (+ a PAT) and an OpenVSX account.
- [ ] `semgrep` available where the CLI runs (`pipx install semgrep` / `brew install semgrep`).

## Release order (matters)

1. **Deploy the docs site first.** Every finding prints `https://oauthlint.dev/rules/<id>`;
   those pages must exist before anyone installs.
   ```bash
   pnpm --filter oauthlint-site build   # builds the Astro site to site/dist
   # auto-deploys to oauthlint.dev (Cloudflare Pages) via
   # .github/workflows/pages.yml on push to main
   # local preview: pnpm --filter oauthlint-site dev
   ```

2. **Cut versions with Changesets.** *(Skip for the very first 0.1.0 publish —
   the packages are already at 0.1.0; go straight to step 3. Use changesets from
   the next release onward.)*
   ```bash
   pnpm changeset            # describe the change(s); pick bump levels
   pnpm version-packages     # apply bumps + write CHANGELOGs
   git commit -am "release: version packages" && git push
   ```

3. **Publish to npm** (rules first — the CLI depends on it).
   ```bash
   pnpm build
   pnpm release              # = pnpm build && changeset publish (publishes both, in order)
   ```

4. **Tag + GitHub Release + Action listing.**
   ```bash
   git tag v0.1.0 && git push --tags
   gh release create v0.1.0 --generate-notes
   ```
   Then publish the Action to GitHub Marketplace from the release page
   (Action metadata lives in `action/action.yml`).

5. **Publish the VS Code extension.**
   ```bash
   cd vscode
   pnpm dlx @vscode/vsce publish      # needs the `auspeo` publisher PAT
   pnpm dlx ovsx publish              # OpenVSX mirror
   ```

## Post-publish smoke tests

> **Mandatory — this catches monorepo hoisting bugs.** Always test a *clean
> external install*, not the workspace. v0.1.0 shipped broken because
> `oauthlint-rules` listed `fast-glob` as a devDependency; it resolved via
> workspace hoisting in every local test, then crashed on real installs with
> `ERR_MODULE_NOT_FOUND`. The fix shipped as 0.1.1; 0.1.0 was `npm deprecate`d.

```bash
# fresh dir, OUTSIDE the workspace
D=$(mktemp -d); cd "$D"; npm init -y
npm i oauthlint@latest
node node_modules/oauthlint/bin/oauthlint.js --version   # must not crash
npx oauthlint@latest scan ./some-app --fail-on HIGH
# confirm a finding's doc URL resolves (oauthlint.dev/rules/<id>)
```
Sanity-check every published package's runtime imports are in `dependencies`
(not `devDependencies`): `grep -rhoE "from '[^.]" <pkg>/dist` vs its
`dependencies`.
- Add the Action to a throwaway repo and confirm it runs.
- Install the extension from the Marketplace and confirm diagnostics appear.

## Auth & follow-ups

- **Publish auth:** the repo's global `~/.npmrc` token may be stale. Publish with
  the `auspeo` granular token from `~/.secrets/npm.env`, injected via a temp
  `.npmrc` line `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` (no secret on
  disk). Verify identity first: `npm whoami` should print `auspeo`.
- **Token expiry:** the current granular token **expires 2026-09-17**. Renew it
  (npm → Access Tokens) before then or CI/local publishes will fail.
- **Migrate to Trusted Publishing:** now that the packages exist on npm,
  configure OIDC Trusted Publishing per package (npm package settings → linked to
  this repo + `release.yml`), then revoke the long-lived token. Can't be done for
  a brand-new package's first publish — only after it exists.
- **GitHub Marketplace (Action) + repo visibility:** publishing the Action to
  Marketplace requires a **public** repo. The repo is currently private; make it
  public (the OSS wedge anyway) to list the Action.

## Automated path (optional)

`.github/workflows/release.yml` runs the Changesets action on pushes to `main`.
It is **gated off by default** (the job is skipped) so it never tries an
auth-less publish. To enable automated npm releases:

1. Add repo **secret** `NPM_TOKEN` (an npm automation token).
2. Add repo **variable** `NPM_PUBLISH` = `enabled`.

Once enabled it opens/updates a "Version Packages" PR from pending changesets
and publishes to npm when that PR is merged. The marketplace artifacts (Action,
VS Code extension) are always published manually.
