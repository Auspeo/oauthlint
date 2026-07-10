# OAuthLint for JetBrains IDEs

OAuthLint catches OAuth, OIDC, JWT, session, cookie, and CORS anti-patterns that
AI coding tools frequently produce, and surfaces them as native inline
annotations while you edit. It is the JetBrains counterpart to the OAuthLint
VS Code extension and shares the same rule pack and scan engine.

## What it does

- Scans the current file on open and on save.
- Renders each finding as a native IDE annotation: an inline highlight, a gutter
  marker, and a tooltip carrying the rule id, the explanation, and a link to the
  rule documentation.
- Maps severity onto the IDE's own levels: CRITICAL and HIGH become errors,
  MEDIUM becomes a warning, and LOW and INFO become weak warnings.

## Self-contained

There is nothing else to install.

- The OAuthLint rule pack is bundled inside the plugin jar and extracted to a
  versioned cache directory on first use.
- The Opengrep scan engine (a single-file, Semgrep-compatible binary) is
  downloaded once from the pinned v1.25.0 release, verified against a pinned
  SHA-256 checksum before it is ever made executable, and cached. If the download
  fails (for example on an offline first run), the plugin shows a notification
  with a Retry action and never blocks the editor.

You can point the plugin at your own opengrep or semgrep binary in
Settings, Tools, OAuthLint if you prefer to manage the engine yourself.

## Supported IDEs and languages

Installs in any JetBrains IDE (built on the IntelliJ Platform). The per-language
scanners activate automatically wherever the matching language support is
present:

- JavaScript and TypeScript (WebStorm, IDEs with JS support)
- Python (PyCharm, IDEs with the Python plugin)
- Go (GoLand, IDEs with the Go plugin)
- Rust (RustRover, IDEs with the Rust plugin)
- Java (IntelliJ IDEA, IDEs with the Java plugin)

## Settings

Settings, Tools, OAuthLint:

- Enable or disable scanning on open and save.
- Minimum severity to surface (INFO through CRITICAL).
- Engine path override (optional). Empty means download and cache automatically.

## Build

This module uses the IntelliJ Platform Gradle Plugin 2.x and targets IntelliJ
IDEA Community 2024.2 (sinceBuild 242). A pinned Gradle wrapper (8.10.2) is
included, so no system Gradle is required.

```
./gradlew buildPlugin
```

The built plugin zip lands in `build/distributions/`. To run it in a sandbox
IDE, use `./gradlew runIde`.

The rule pack is copied into the plugin resources at build time from the
sibling `rules/rules` directory of this monorepo by the `bundleRules` Gradle
task, so the packaged plugin always carries the current rules.
