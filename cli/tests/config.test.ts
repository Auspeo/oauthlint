import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, loadConfig } from '../src/core/config.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'oauthlint-config-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('returns DEFAULT_CONFIG when no config file exists', async () => {
    const cfg = await loadConfig(dir);
    expect(cfg.failOn).toBe(DEFAULT_CONFIG.failOn);
  });

  it('parses .oauthlintrc.yml with failOn override', async () => {
    await writeFile(join(dir, '.oauthlintrc.yml'), 'version: 1\nfailOn: CRITICAL\n', 'utf8');
    const cfg = await loadConfig(dir);
    expect(cfg.failOn).toBe('CRITICAL');
  });

  it('rejects an invalid failOn value', async () => {
    await writeFile(join(dir, '.oauthlintrc.yml'), 'version: 1\nfailOn: APOCALYPSE\n', 'utf8');
    await expect(loadConfig(dir)).rejects.toThrow(/Invalid oauthlint config/);
  });

  it('accepts per-rule overrides', async () => {
    await writeFile(
      join(dir, '.oauthlintrc.yml'),
      'version: 1\nrules:\n  auth.cookie.no-samesite: warn\n  auth.session.id-in-url: off\n',
      'utf8',
    );
    const cfg = await loadConfig(dir);
    expect(cfg.rules).toMatchObject({
      'auth.cookie.no-samesite': 'warn',
      'auth.session.id-in-url': 'off',
    });
  });
});
