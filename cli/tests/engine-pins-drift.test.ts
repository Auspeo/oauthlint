import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ASSETS, CHECKSUMS, OPENGREP_VERSION } from '../src/engine/pins.js';

/**
 * The JetBrains plugin is written in Kotlin and cannot import the canonical
 * TypeScript pins (`cli/src/engine/pins.ts`). This guard reads its EngineManager
 * source and asserts the pinned version, per-asset SHA-256 checksums, and asset
 * names all match the canonical values, so the two copies cannot silently drift
 * when the engine is bumped.
 */
const here = dirname(fileURLToPath(import.meta.url));
const kotlinPath = join(
  here,
  '../../jetbrains/src/main/kotlin/dev/oauthlint/engine/EngineManager.kt',
);
const kotlin = readFileSync(kotlinPath, 'utf8');

describe('JetBrains engine pins match the canonical TypeScript pins', () => {
  it('pins the same Opengrep version', () => {
    expect(kotlin).toContain(`"${OPENGREP_VERSION}"`);
  });

  it('pins the same SHA-256 for every asset', () => {
    for (const [asset, sha] of Object.entries(CHECKSUMS)) {
      expect(kotlin, `${asset}: checksum missing or changed in the Kotlin copy`).toContain(sha);
      expect(kotlin, `${asset}: asset name missing in the Kotlin copy`).toContain(asset);
    }
  });

  it('maps the same per-platform assets', () => {
    for (const choice of Object.values(ASSETS)) {
      expect(kotlin).toContain(choice.primary);
      if (choice.fallback) {
        expect(kotlin).toContain(choice.fallback);
      }
    }
  });
});
