# oauthlint-vscode

## 0.4.0

### Minor Changes

- Added an "Apply fix" Quick Fix. When a finding carries an autofix, the
  lightbulb now offers "Apply OAuthLint fix for `<rule-id>`", which applies the
  replacement directly in the editor. It reads the per-finding fix the CLI
  reports, so there is no separate `--fix` run. The existing Suppress and Open
  documentation actions are unchanged.

## 0.3.0

### Minor Changes

- Added a rich hover on findings. Hover an OAuthLint diagnostic to see the rule
  id, the full message, the CWE when available, and a link to the rule's docs.

## 0.2.0

### Minor Changes

- Added a status bar item showing the OAuthLint finding count for the active
  file, with a spinner while scanning, a warning state (pointing at
  `oauthlint.cliPath`) when the CLI can't be run, and click-to-rescan. It hides
  for non-JS/TS files.

## 0.1.1

### Patch Changes

- Updated dependencies
  - oauthlint@0.1.1
