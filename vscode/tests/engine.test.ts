import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHECKSUMS,
  type EngineDeps,
  EngineManager,
  EngineUnavailableError,
  OPENGREP_VERSION,
} from '../src/engine.js';

/**
 * The engine manager is exercised entirely through injected fakes: no real
 * network, filesystem, or child processes. Each test builds a `deps` object
 * that records calls, so we can assert the resolution order (setting -> cache
 * -> PATH -> download), the download+verify flow, and the failure handling
 * without touching disk or hitting GitHub.
 */

const STORAGE = '/gs';

interface FakeState {
  existing: Set<string>;
  versions: Map<string, string | null>;
  onPath: string | null;
  downloads: string[];
  downloadImpl: (url: string, dest: string) => Promise<void>;
}

function makeDeps(state: FakeState, overrides: Partial<EngineDeps> = {}): EngineDeps {
  return {
    platform: 'darwin',
    arch: 'arm64',
    pathExists: async (p) => state.existing.has(p),
    mkdirp: async () => {},
    makeExecutable: async () => {},
    runVersion: async (b) => state.versions.get(b) ?? null,
    whichOpengrep: async () => state.onPath,
    download: async (url, dest, onProgress) => {
      state.downloads.push(url);
      onProgress?.(41, 41);
      await state.downloadImpl(url, dest);
    },
    // Default: report the genuine pinned checksum for whichever asset was just
    // fetched, so the happy-path tests download successfully. Tests that probe
    // integrity handling override this.
    hashFile: async () => {
      const url = state.downloads[state.downloads.length - 1] ?? '';
      const asset = url.split('/').pop() ?? '';
      return CHECKSUMS[asset] ?? 'unpinned';
    },
    ...overrides,
  };
}

function baseState(): FakeState {
  return {
    existing: new Set<string>(),
    versions: new Map<string, string | null>(),
    onPath: null,
    downloads: [],
    downloadImpl: async () => {},
  };
}

const cachedBinary = join(STORAGE, 'opengrep', `v${OPENGREP_VERSION}`, 'opengrep');

afterEach(() => vi.restoreAllMocks());

describe('EngineManager.resolve', () => {
  it('prefers an explicit enginePath setting that exists, skipping download', async () => {
    const state = baseState();
    state.existing.add('/usr/local/bin/semgrep');
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      getEnginePath: () => '/usr/local/bin/semgrep',
      deps: makeDeps(state),
    });
    expect(await engine.resolve()).toBe('/usr/local/bin/semgrep');
    expect(state.downloads).toEqual([]);
  });

  it('errors when the configured enginePath does not exist', async () => {
    const state = baseState();
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      getEnginePath: () => '/nope/semgrep',
      deps: makeDeps(state),
    });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
  });

  it('uses the cached binary when it exists and reports the pinned version', async () => {
    const state = baseState();
    state.existing.add(cachedBinary);
    state.versions.set(cachedBinary, OPENGREP_VERSION);
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps: makeDeps(state) });
    expect(await engine.resolve()).toBe(cachedBinary);
    expect(state.downloads).toEqual([]);
  });

  it('ignores a cached binary whose version does not match, then downloads', async () => {
    const state = baseState();
    state.existing.add(cachedBinary);
    state.versions.set(cachedBinary, '9.9.9');
    // After a successful download the binary verifies as the pinned version.
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps: makeDeps(state) });
    expect(await engine.resolve()).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(1);
  });

  it('prefers an opengrep on PATH before downloading', async () => {
    const state = baseState();
    state.onPath = '/opt/bin/opengrep';
    state.versions.set('/opt/bin/opengrep', OPENGREP_VERSION);
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps: makeDeps(state) });
    expect(await engine.resolve()).toBe('/opt/bin/opengrep');
    expect(state.downloads).toEqual([]);
  });

  it('downloads the correct asset for the platform and verifies the version', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      deps: makeDeps(state, { platform: 'linux', arch: 'x64' }),
    });
    const path = await engine.resolve();
    expect(path).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(1);
    expect(state.downloads[0]).toContain(`v${OPENGREP_VERSION}/opengrep_manylinux_x86`);
  });

  it('uses the .exe binary name on Windows', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      deps: makeDeps(state, { platform: 'win32', arch: 'x64' }),
    });
    const path = await engine.resolve();
    expect(path.endsWith('opengrep.exe')).toBe(true);
    expect(state.downloads[0]).toContain('opengrep_windows_x86.exe');
  });

  it('falls back to the musl asset on Linux when the glibc binary will not run', async () => {
    const state = baseState();
    let attempt = 0;
    const deps = makeDeps(state, {
      platform: 'linux',
      arch: 'arm64',
      download: async (url, dest) => {
        state.downloads.push(url);
        attempt += 1;
        state.existing.add(dest);
        // First (manylinux) download verifies as broken; second (musl) is good.
        state.versions.set(dest, attempt === 1 ? null : OPENGREP_VERSION);
      },
    });
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps });
    const path = await engine.resolve();
    expect(path).toBe(join(STORAGE, 'opengrep', `v${OPENGREP_VERSION}`, 'opengrep'));
    expect(state.downloads).toHaveLength(2);
    expect(state.downloads[0]).toContain('manylinux');
    expect(state.downloads[1]).toContain('musllinux');
  });

  it('throws EngineUnavailableError for an unsupported platform', async () => {
    const state = baseState();
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      deps: makeDeps(state, { platform: 'sunos', arch: 'x64' }),
    });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
  });

  it('rejects a downloaded binary whose checksum does not match the pinned value', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    let madeExecutable = false;
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      deps: makeDeps(state, {
        // A tampered/swapped asset: hashes to something other than the pin.
        hashFile: async () => 'deadbeef',
        makeExecutable: async () => {
          madeExecutable = true;
        },
      }),
    });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
    // The bad binary is rejected before it is ever made executable.
    expect(madeExecutable).toBe(false);
  });

  it('falls back to the musl asset when the glibc download fails its checksum', async () => {
    const state = baseState();
    let attempt = 0;
    const deps = makeDeps(state, {
      platform: 'linux',
      arch: 'x64',
      download: async (url, dest) => {
        state.downloads.push(url);
        state.existing.add(dest);
        state.versions.set(dest, OPENGREP_VERSION);
      },
      hashFile: async () => {
        attempt += 1;
        // First (manylinux) fails its checksum; second (musl) matches its pin.
        return attempt === 1 ? 'deadbeef' : CHECKSUMS.opengrep_musllinux_x86;
      },
    });
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps });
    expect(await engine.resolve()).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(2);
    expect(state.downloads[1]).toContain('musllinux');
  });

  it('throws EngineUnavailableError when the download fails', async () => {
    const state = baseState();
    state.downloadImpl = async () => {
      throw new Error('network down');
    };
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps: makeDeps(state) });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
  });

  it('memoises a successful resolution (no second download)', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps: makeDeps(state) });
    await engine.resolve();
    await engine.resolve();
    expect(state.downloads).toHaveLength(1);
  });

  it('shares one in-flight download across concurrent callers', async () => {
    const state = baseState();
    let signalStarted: () => void = () => {};
    let release: () => void = () => {};
    const started = new Promise<void>((res) => {
      signalStarted = res;
    });
    const gate = new Promise<void>((res) => {
      release = res;
    });
    const deps = makeDeps(state, {
      download: async (url, dest) => {
        state.downloads.push(url);
        signalStarted();
        await gate;
        state.existing.add(dest);
        state.versions.set(dest, OPENGREP_VERSION);
      },
    });
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps });
    const a = engine.resolve();
    const b = engine.resolve();
    await started; // exactly one download has begun
    release();
    expect(await a).toBe(cachedBinary);
    expect(await b).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(1);
  });

  it('reset() clears a failed resolution so it can be retried', async () => {
    const state = baseState();
    state.downloadImpl = async () => {
      throw new Error('offline');
    };
    const engine = new EngineManager({ globalStorageDir: STORAGE, deps: makeDeps(state) });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);

    // Now the network recovers; a retry after reset succeeds.
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    engine.reset();
    expect(await engine.resolve()).toBe(cachedBinary);
  });

  it('reports progress through the withDownloadUI wrapper', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const messages: string[] = [];
    const engine = new EngineManager({
      globalStorageDir: STORAGE,
      deps: makeDeps(state),
      withDownloadUI: (run) => run((message) => messages.push(message)),
    });
    await engine.resolve();
    expect(messages.some((m) => m.includes('Downloading the OAuthLint scan engine'))).toBe(true);
  });
});
