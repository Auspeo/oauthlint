/**
 * Conventional Commits enforcement.
 * https://www.conventionalcommits.org
 *
 * Format: <type>(<optional scope>): <subject>
 * Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
 * Suggested scopes (not enforced): rules, cli, action, vscode, docs, deps, ci, release
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0, 'always'], // allow long lines in commit bodies (e.g. pasted output)
  },
};
