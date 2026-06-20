<!-- Thanks for contributing to oauthlint! Keep PRs focused and small where you can. -->

## What this changes

<!-- A short description, and the issue it closes if any (e.g. "Closes #12"). -->

## Type

- [ ] New rule
- [ ] Fix a false positive / a miss
- [ ] Bug fix (CLI / Action / extension)
- [ ] Docs
- [ ] Chore / tooling

## Checklist

- [ ] `pnpm test:run` passes locally (Semgrep installed)
- [ ] `pnpm lint` and `pnpm typecheck` pass
- [ ] If a rule changed: added/updated `vulnerable.ts` + `safe.ts` fixtures
- [ ] If a rule changed: ran `pnpm docs:rules`
- [ ] Added a changeset (`pnpm changeset`) if this affects a published package
- [ ] Commits follow Conventional Commits
