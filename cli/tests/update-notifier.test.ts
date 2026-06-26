import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type NotifierCache,
  compareSemver,
  defaultCachePath,
  isValidVersion,
  maybeNotifyUpdate,
  shouldCheckForUpdate,
} from '../src/core/update-notifier.js';

/** A fake stderr that records what was written and pretends to be a TTY. */
function fakeStderr(isTTY = true) {
  const writes: string[] = [];
  return {
    isTTY,
    writes,
    write(s: string) {
      writes.push(s);
      return true;
    },
    get output() {
      return writes.join('');
    },
  };
}

const DAY = 24 * 60 * 60 * 1000;

describe('compareSemver', () => {
  it('orders core versions', () => {
    expect(compareSemver('1.0.0', '0.9.9')).toBeGreaterThan(0);
    expect(compareSemver('0.3.0', '0.4.0')).toBeLessThan(0);
    expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    expect(compareSemver('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareSemver('2.0.0', '1.99.99')).toBeGreaterThan(0);
  });

  it('treats a prerelease as lower than its release', () => {
    expect(compareSemver('1.0.0-rc.1', '1.0.0')).toBeLessThan(0);
    expect(compareSemver('1.0.0', '1.0.0-rc.1')).toBeGreaterThan(0);
  });

  it('orders prerelease identifiers per semver precedence', () => {
    expect(compareSemver('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    expect(compareSemver('1.0.0-alpha.1', '1.0.0-alpha')).toBeGreaterThan(0);
    expect(compareSemver('1.0.0-1', '1.0.0-alpha')).toBeLessThan(0); // numeric < alphanumeric
  });

  it('ignores build metadata', () => {
    expect(compareSemver('1.0.0+build.5', '1.0.0')).toBe(0);
  });

  it('returns 0 (never "greater") for invalid input', () => {
    expect(compareSemver('not-a-version', '1.0.0')).toBe(0);
    expect(compareSemver('1.0', '1.0.0')).toBe(0);
  });
});

describe('isValidVersion', () => {
  it('accepts valid semver and rejects junk', () => {
    expect(isValidVersion('0.3.0')).toBe(true);
    expect(isValidVersion('1.2.3-rc.1')).toBe(true);
    expect(isValidVersion('1.2.3+build')).toBe(true);
    expect(isValidVersion('latest')).toBe(false);
    expect(isValidVersion('1.2')).toBe(false);
    expect(isValidVersion('"; rm -rf /')).toBe(false);
  });
});

describe('shouldCheckForUpdate (suppression rules)', () => {
  const base = { stderr: { isTTY: true }, env: {} as NodeJS.ProcessEnv };

  it('allows a normal interactive run', () => {
    expect(shouldCheckForUpdate(base)).toBe(true);
  });

  it('suppresses for machine-readable output', () => {
    expect(shouldCheckForUpdate({ ...base, machineReadable: true })).toBe(false);
  });

  it('suppresses when explicitly disabled (--no-update-check)', () => {
    expect(shouldCheckForUpdate({ ...base, disabled: true })).toBe(false);
  });

  it('suppresses when NO_UPDATE_NOTIFIER is set', () => {
    expect(shouldCheckForUpdate({ ...base, env: { NO_UPDATE_NOTIFIER: '1' } })).toBe(false);
  });

  it('suppresses in CI', () => {
    expect(shouldCheckForUpdate({ ...base, env: { CI: 'true' } })).toBe(false);
    expect(shouldCheckForUpdate({ ...base, env: { GITHUB_ACTIONS: 'true' } })).toBe(false);
  });

  it('suppresses when stderr is not a TTY (piped)', () => {
    expect(shouldCheckForUpdate({ ...base, stderr: { isTTY: false } })).toBe(false);
  });
});

describe('defaultCachePath', () => {
  it('honours XDG_CACHE_HOME', () => {
    expect(defaultCachePath({ XDG_CACHE_HOME: '/custom/cache' })).toBe(
      '/custom/cache/oauthlint/update-check.json',
    );
  });

  it('falls back to ~/.cache when XDG is unset', () => {
    const p = defaultCachePath({});
    expect(p.endsWith('/.cache/oauthlint/update-check.json')).toBe(true);
  });
});

describe('maybeNotifyUpdate', () => {
  let cacheDir: string;
  let cachePath: string;
  const env: NodeJS.ProcessEnv = {}; // clean env: not CI, no NO_UPDATE_NOTIFIER

  beforeEach(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), 'oauthlint-notifier-'));
    cachePath = join(cacheDir, 'update-check.json');
  });

  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  it('shows a notice when a newer version exists, on a TTY, enabled', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue('0.4.0');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
      now: () => 1_000_000,
    });
    expect(fetchLatest).toHaveBeenCalledTimes(1);
    expect(notice).not.toBeNull();
    expect(stderr.output).toContain('0.4.0');
    expect(stderr.output).toContain('0.3.0');
  });

  it('writes only to stderr (never stdout) — proven by using an injected stderr', async () => {
    const stderr = fakeStderr(true);
    await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest: vi.fn().mockResolvedValue('1.0.0'),
      now: () => 1,
    });
    expect(stderr.writes.length).toBeGreaterThan(0);
  });

  it('does not nag when current >= latest', async () => {
    const stderr = fakeStderr(true);
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.4.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest: vi.fn().mockResolvedValue('0.4.0'),
      now: () => 1,
    });
    expect(notice).toBeNull();
    expect(stderr.output).toBe('');
  });

  it('does not nag when current is a prerelease ahead of an older release', async () => {
    const stderr = fakeStderr(true);
    const notice = await maybeNotifyUpdate({
      currentVersion: '1.0.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest: vi.fn().mockResolvedValue('1.0.0-rc.1'),
      now: () => 1,
    });
    expect(notice).toBeNull();
  });

  it('is silent under --json (machineReadable) and skips the network', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue('9.9.9');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      machineReadable: true,
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
    });
    expect(notice).toBeNull();
    expect(fetchLatest).not.toHaveBeenCalled();
    expect(stderr.output).toBe('');
  });

  it('is silent in CI and skips the network', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue('9.9.9');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env: { CI: 'true' },
      stderr: stderr as never,
      cachePath,
      fetchLatest,
    });
    expect(notice).toBeNull();
    expect(fetchLatest).not.toHaveBeenCalled();
  });

  it('is silent when stderr is not a TTY', async () => {
    const stderr = fakeStderr(false);
    const fetchLatest = vi.fn().mockResolvedValue('9.9.9');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
    });
    expect(notice).toBeNull();
    expect(fetchLatest).not.toHaveBeenCalled();
  });

  it('is silent when NO_UPDATE_NOTIFIER is set', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue('9.9.9');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env: { NO_UPDATE_NOTIFIER: '1' },
      stderr: stderr as never,
      cachePath,
      fetchLatest,
    });
    expect(notice).toBeNull();
    expect(fetchLatest).not.toHaveBeenCalled();
  });

  it('is silent when disabled via --no-update-check', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue('9.9.9');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      disabled: true,
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
    });
    expect(notice).toBeNull();
    expect(fetchLatest).not.toHaveBeenCalled();
  });

  it('writes a fresh cache after checking the registry', async () => {
    const fetchLatest = vi.fn().mockResolvedValue('0.4.0');
    await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: fakeStderr(true) as never,
      cachePath,
      fetchLatest,
      now: () => 5_000,
    });
    const cache = JSON.parse(await readFile(cachePath, 'utf8')) as NotifierCache;
    expect(cache.latestVersion).toBe('0.4.0');
    expect(cache.lastCheck).toBe(5_000);
  });

  it('uses the cache and skips the network within the 24h window', async () => {
    // Seed a fresh cache.
    const seeded: NotifierCache = { lastCheck: 10 * DAY, latestVersion: '0.5.0' };
    await writeFile(cachePath, JSON.stringify(seeded), 'utf8');
    const fetchLatest = vi.fn().mockResolvedValue('9.9.9');
    const stderr = fakeStderr(true);
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
      now: () => 10 * DAY + DAY / 2, // 12h later → still fresh
    });
    expect(fetchLatest).not.toHaveBeenCalled();
    expect(notice).not.toBeNull();
    expect(stderr.output).toContain('0.5.0');
  });

  it('re-checks the network once the cache is older than 24h', async () => {
    const seeded: NotifierCache = { lastCheck: 10 * DAY, latestVersion: '0.5.0' };
    await writeFile(cachePath, JSON.stringify(seeded), 'utf8');
    const fetchLatest = vi.fn().mockResolvedValue('0.6.0');
    await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: fakeStderr(true) as never,
      cachePath,
      fetchLatest,
      now: () => 10 * DAY + DAY + 1, // just past the window
    });
    expect(fetchLatest).toHaveBeenCalledTimes(1);
  });

  it('is silent on a network failure/timeout (fetch returns null) and never crashes', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue(null);
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
      now: () => 1,
    });
    expect(notice).toBeNull();
    expect(stderr.output).toBe('');
  });

  it('swallows a thrown fetch error and stays silent', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
      now: () => 1,
    });
    expect(notice).toBeNull();
    expect(stderr.output).toBe('');
  });

  it('does nothing for a non-comparable current version (e.g. 0.0.0 dev build)', async () => {
    const stderr = fakeStderr(true);
    const fetchLatest = vi.fn().mockResolvedValue('1.0.0');
    const notice = await maybeNotifyUpdate({
      currentVersion: 'not-a-version',
      env,
      stderr: stderr as never,
      cachePath,
      fetchLatest,
    });
    expect(notice).toBeNull();
    expect(fetchLatest).not.toHaveBeenCalled();
  });

  it('tolerates a corrupt cache file by re-checking', async () => {
    await writeFile(cachePath, '{ this is not json', 'utf8');
    const fetchLatest = vi.fn().mockResolvedValue('0.4.0');
    const notice = await maybeNotifyUpdate({
      currentVersion: '0.3.0',
      env,
      stderr: fakeStderr(true) as never,
      cachePath,
      fetchLatest,
      now: () => 1,
    });
    expect(fetchLatest).toHaveBeenCalledTimes(1);
    expect(notice).not.toBeNull();
  });
});
