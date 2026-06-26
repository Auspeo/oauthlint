<!--
OAuthLint release-notes skeleton. Copy this into `gh release edit <tag> --notes`
(or the release UI). Keep only the change groups that actually apply, and delete
every guidance comment + unused placeholder before publishing. See the "Writing
release notes" section of RELEASE.md for the checklist and cadence.
-->

<!-- INTRO: 1–2 sentences — what this release is, and who it helps. -->
<One- or two-sentence summary of the release and its audience.>

<!--
GROUPED CHANGES: include only the groups below that apply, in this order.
Each bullet = WHAT changed + the PROBLEM it solves, then the PR link `(#NN)`.
Use real, verified merged PR numbers only — never invent them.
-->

### ✨ New
<!-- New features / rules / capabilities. -->
- <What shipped> — <the problem it solves / why it matters>. (#NN)

### 🐛 Fixes
<!-- Bug fixes; name the symptom users saw. -->
- <What was broken and is now fixed> — <impact>. (#NN)

### 🔒 Security
<!-- Security-relevant changes: new detections, hardening, advisories. -->
- <The security change> — <the risk it addresses>. (#NN)

### 📚 Docs
<!-- User-facing docs, README, site, examples. -->
- <Doc change> — <what it clarifies or unblocks>. (#NN)

### 🧰 Internal
<!-- CI, build, deps, refactors — only if user-visible or notable. -->
- <Internal change> — <why it matters>. (#NN)

<!--
INSTALL / UPGRADE: exact commands for the artifact this tag ships.
Keep the block(s) that apply; delete the rest.
-->

## Install / upgrade

```bash
# CLI (npm)
npm i -g oauthlint@<version>
# or, no install:
npx oauthlint@<version> scan ./src
```

```yaml
# GitHub Action
- uses: Auspeo/oauthlint/action@v1
  with:
    fail-on: HIGH
```

```text
# VS Code extension (Marketplace id)
auspeo.oauthlint
```

<!--
FULL CHANGELOG: compare link against the actual previous tag for this artifact.
For the very first release of an artifact, link the tree at the tag instead:
https://github.com/Auspeo/oauthlint/tree/<tag>
-->

**Full changelog:** https://github.com/Auspeo/oauthlint/compare/<prevtag>...<tag>
