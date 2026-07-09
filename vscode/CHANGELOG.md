# Changelog

All notable changes to the OAuthLint VS Code extension are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.5.0] - 2026-07-09

### Changed

- The extension now bundles the OAuthLint engine and rule pack, so
  `npm i -g oauthlint` is no longer required; Semgrep is still needed and the
  extension now offers a one-click install if it is missing.

### Removed

- The `oauthlint.cliPath` setting. Scans now run in-process, so there is no
  external CLI to point at.

## [0.4.2] - 2026-06-29

### Changed

- The Marketplace and Open VSX overview now leads with the project banner, and
  this changelog is restructured to the Keep a Changelog format with dates. No
  functional changes to the extension.

## [0.4.1] - 2026-06-29

### Fixed

- A per-file scan now clears only that file's diagnostics instead of the whole
  workspace, so saving two files in quick succession no longer drops one file's
  squiggles.
- Scan output is capped so a runaway process cannot exhaust memory.
- The scanned path is passed after `--` so it can never be read as a flag.

## [0.4.0] - 2026-06-29

### Added

- An "Apply fix" Quick Fix. When a finding carries an autofix, the lightbulb now
  offers "Apply OAuthLint fix for `<rule-id>`", which applies the replacement
  directly in the editor. It reads the per-finding fix the CLI reports, so there
  is no separate `--fix` run. The existing Suppress and Open documentation
  actions are unchanged.

## [0.3.0] - 2026-06-28

### Added

- A rich hover on findings. Hover an OAuthLint diagnostic to see the rule id,
  the full message, the CWE when available, and a link to the rule's docs.

## [0.2.0] - 2026-06-26

### Added

- A status bar item showing the OAuthLint finding count for the active file,
  with a spinner while scanning, a warning state (pointing at
  `oauthlint.cliPath`) when the CLI can't be run, and click-to-rescan. It hides
  for non-JS/TS files.

## [0.1.1] - 2026-06-19

### Changed

- Updated dependencies
  - oauthlint@0.1.1
