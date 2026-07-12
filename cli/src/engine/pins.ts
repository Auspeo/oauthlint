/**
 * Canonical pins for the bundled Opengrep engine: the version, the per-platform
 * release assets, and their SHA-256 checksums. This is the SINGLE SOURCE OF
 * TRUTH shared by every OAuthLint surface that manages the engine:
 *   - the CLI engine manager (`./manager.ts`) imports it directly;
 *   - the VS Code extension imports it from the published `oauthlint` package;
 *   - the JetBrains (Kotlin) plugin cannot import TypeScript, so a drift-guard
 *     test (`cli/tests/engine-pins-drift.test.ts`) asserts its constants match
 *     these values.
 *
 * To bump the engine: change OPENGREP_VERSION, download each asset, run
 * `shasum -a 256`, update CHECKSUMS here, and update the Kotlin copy (the guard
 * test will fail until they match).
 */

/** The Opengrep release this project pins. Opengrep is a Python-free, single-file, Semgrep-compatible engine. */
export const OPENGREP_VERSION = '1.25.0';

/** Base URL of the pinned release's download assets. */
export const RELEASE_BASE = `https://github.com/opengrep/opengrep/releases/download/v${OPENGREP_VERSION}`;

/** The download URL for a given release asset. */
export function assetUrl(asset: string): string {
  return `${RELEASE_BASE}/${asset}`;
}

/**
 * A per-platform asset choice. Linux entries carry a musl fallback used only
 * when the default (glibc / manylinux) binary fails to run on the host.
 */
export interface AssetChoice {
  /** Primary asset name (glibc on Linux). */
  primary: string;
  /** Optional musl fallback, tried only if the primary binary won't run. */
  fallback?: string;
}

/** Maps `${platform}/${arch}` (Node's `process.platform`/`process.arch`) to its release asset. */
export const ASSETS: Record<string, AssetChoice> = {
  'darwin/arm64': { primary: 'opengrep_osx_arm64' },
  'darwin/x64': { primary: 'opengrep_osx_x86' },
  'linux/arm64': { primary: 'opengrep_manylinux_aarch64', fallback: 'opengrep_musllinux_aarch64' },
  'linux/x64': { primary: 'opengrep_manylinux_x86', fallback: 'opengrep_musllinux_x86' },
  'win32/x64': { primary: 'opengrep_windows_x86.exe' },
};

/**
 * SHA-256 of each pinned release asset, verified against the actual v1.25.0
 * binaries. A downloaded file whose hash is not in this table, or does not
 * match, is rejected before it is ever made executable, so a tampered or
 * swapped release asset cannot be run.
 */
export const CHECKSUMS: Record<string, string> = {
  opengrep_osx_arm64: '3543fcabae9db2ae5bc974a3b75426353f0a3e369181b2157ef27f46867996c8',
  opengrep_osx_x86: 'fa2487b75527be1cc9ae4f9b0cb09a340454e7973c76785568285cbbcd977cb4',
  opengrep_manylinux_aarch64: 'fd40124272d006082a5594b19aecee07b01dd50933d8add7a4fd5c557d2be5f6',
  opengrep_manylinux_x86: '9ac4aebb47ba3f7b0d8fc641ac8749cb6c2f253f616131a67d9631e00d4bea33',
  opengrep_musllinux_aarch64: '32836a4e86857522c5400c095b1451d6713aff946dd680da7971f0edc21d443a',
  opengrep_musllinux_x86: '83ac4d22cfb1a828ae0e48b88dbc3a78d97d53b5f7fafd37f83d0ed7e3b7d97c',
  'opengrep_windows_x86.exe': 'b010709bb790086083442eabe9a0b6bf48064ed87cdf808591baecdb60ccdf73',
};
