import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type EngineDeps, EngineManager, EngineUnavailableError } from '../src/engine/manager.js';
import { CHECKSUMS, OPENGREP_VERSION } from '../src/engine/pins.js';

/**
 * The engine manager is exercised entirely through injected fakes: no real
 * network, filesystem, or child processes. Each test builds a `deps` object
 * that records calls, so we can assert the resolution order
 * (override -> PATH opengrep -> PATH semgrep -> cache -> download), the
 * download+verify flow, and the failure handling without touching disk or
 * hitting GitHub.
 */

const CACHE = '/cache';

interface FakeState {
  existing: Set<string>;
  versions: Map<string, string | null>;
  which: Map<string, string | null>;
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
    whichOnPath: async (name) => state.which.get(name) ?? null,
    identifyKind: async () => null,
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
    which: new Map<string, string | null>(),
    downloads: [],
    downloadImpl: async () => {},
  };
}

interface ManagerOverrides {
  getEnginePath?: () => string | undefined;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
  deps?: Partial<EngineDeps>;
}

function manager(state: FakeState, opts: ManagerOverrides = {}): EngineManager {
  return new EngineManager({
    cacheDir: CACHE,
    env: opts.env ?? {},
    log: opts.log ?? (() => {}),
    getEnginePath: opts.getEnginePath,
    deps: makeDeps(state, opts.deps),
  });
}

const cachedBinary = join(CACHE, 'opengrep', `v${OPENGREP_VERSION}`, 'opengrep');

afterEach(() => vi.restoreAllMocks());

describe('EngineManager.resolve', () => {
  it('prefers an explicit override that exists, detecting its kind from the basename', async () => {
    const state = baseState();
    state.existing.add('/usr/local/bin/semgrep');
    const engine = manager(state, { getEnginePath: () => '/usr/local/bin/semgrep' });
    const resolved = await engine.resolve();
    expect(resolved.path).toBe('/usr/local/bin/semgrep');
    expect(resolved.engine).toBe('semgrep');
    expect(resolved.source).toBe('override');
    expect(state.downloads).toEqual([]);
  });

  it('detects an opengrep override from its basename', async () => {
    const state = baseState();
    state.existing.add('/opt/opengrep');
    const engine = manager(state, { getEnginePath: () => '/opt/opengrep' });
    const resolved = await engine.resolve();
    expect(resolved.engine).toBe('opengrep');
  });

  it('probes --help for an ambiguously named override', async () => {
    const state = baseState();
    state.existing.add('/opt/scanner');
    const engine = manager(state, {
      getEnginePath: () => '/opt/scanner',
      deps: { identifyKind: async () => 'opengrep' },
    });
    const resolved = await engine.resolve();
    expect(resolved.engine).toBe('opengrep');
  });

  it('reads OAUTHLINT_ENGINE from the environment as the override', async () => {
    const state = baseState();
    state.existing.add('/env/opengrep');
    const engine = new EngineManager({
      cacheDir: CACHE,
      env: { OAUTHLINT_ENGINE: '/env/opengrep' },
      log: () => {},
      deps: makeDeps(state),
    });
    expect((await engine.resolve()).path).toBe('/env/opengrep');
  });

  it('errors when the configured override does not exist', async () => {
    const state = baseState();
    const engine = manager(state, { getEnginePath: () => '/nope/semgrep' });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
  });

  it('prefers an opengrep on PATH over a semgrep on PATH and over downloading', async () => {
    const state = baseState();
    state.which.set('opengrep', '/opt/bin/opengrep');
    state.which.set('semgrep', '/usr/bin/semgrep');
    state.versions.set('/opt/bin/opengrep', OPENGREP_VERSION);
    state.versions.set('/usr/bin/semgrep', '1.99.0');
    const engine = manager(state);
    const resolved = await engine.resolve();
    expect(resolved.path).toBe('/opt/bin/opengrep');
    expect(resolved.engine).toBe('opengrep');
    expect(resolved.source).toBe('path');
    expect(state.downloads).toEqual([]);
  });

  it('falls back to a semgrep on PATH (backward compatible) before downloading', async () => {
    const state = baseState();
    state.which.set('semgrep', '/usr/bin/semgrep');
    state.versions.set('/usr/bin/semgrep', '1.99.0');
    const engine = manager(state);
    const resolved = await engine.resolve();
    expect(resolved.path).toBe('/usr/bin/semgrep');
    expect(resolved.engine).toBe('semgrep');
    expect(resolved.source).toBe('path');
    expect(state.downloads).toEqual([]);
  });

  it('uses the cached binary when it exists and reports the pinned version', async () => {
    const state = baseState();
    state.existing.add(cachedBinary);
    state.versions.set(cachedBinary, OPENGREP_VERSION);
    const engine = manager(state);
    const resolved = await engine.resolve();
    expect(resolved.path).toBe(cachedBinary);
    expect(resolved.engine).toBe('opengrep');
    expect(resolved.source).toBe('cache');
    expect(state.downloads).toEqual([]);
  });

  it('ignores a cached binary whose version does not match, then downloads', async () => {
    const state = baseState();
    state.existing.add(cachedBinary);
    state.versions.set(cachedBinary, '9.9.9');
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = manager(state);
    const resolved = await engine.resolve();
    expect(resolved.path).toBe(cachedBinary);
    expect(resolved.source).toBe('download');
    expect(state.downloads).toHaveLength(1);
  });

  it('downloads the correct asset for the platform and verifies the version', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = manager(state, { deps: { platform: 'linux', arch: 'x64' } });
    const resolved = await engine.resolve();
    expect(resolved.path).toBe(cachedBinary);
    expect(resolved.engine).toBe('opengrep');
    expect(state.downloads).toHaveLength(1);
    expect(state.downloads[0]).toContain(`v${OPENGREP_VERSION}/opengrep_manylinux_x86`);
  });

  it('uses the .exe binary name on Windows', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = manager(state, { deps: { platform: 'win32', arch: 'x64' } });
    const resolved = await engine.resolve();
    expect(resolved.path.endsWith('opengrep.exe')).toBe(true);
    expect(state.downloads[0]).toContain('opengrep_windows_x86.exe');
  });

  it('falls back to the musl asset on Linux when the glibc binary will not run', async () => {
    const state = baseState();
    let attempt = 0;
    const engine = manager(state, {
      deps: {
        platform: 'linux',
        arch: 'arm64',
        download: async (url, dest) => {
          state.downloads.push(url);
          attempt += 1;
          state.existing.add(dest);
          state.versions.set(dest, attempt === 1 ? null : OPENGREP_VERSION);
        },
      },
    });
    const resolved = await engine.resolve();
    expect(resolved.path).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(2);
    expect(state.downloads[0]).toContain('manylinux');
    expect(state.downloads[1]).toContain('musllinux');
  });

  it('throws EngineUnavailableError for an unsupported platform', async () => {
    const state = baseState();
    const engine = manager(state, { deps: { platform: 'sunos', arch: 'x64' } });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
  });

  it('rejects a downloaded binary whose checksum does not match the pinned value', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    let madeExecutable = false;
    const engine = manager(state, {
      deps: {
        hashFile: async () => 'deadbeef',
        makeExecutable: async () => {
          madeExecutable = true;
        },
      },
    });
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
    // The bad binary is rejected before it is ever made executable.
    expect(madeExecutable).toBe(false);
  });

  it('falls back to the musl asset when the glibc download fails its checksum', async () => {
    const state = baseState();
    let attempt = 0;
    const engine = manager(state, {
      deps: {
        platform: 'linux',
        arch: 'x64',
        download: async (url, dest) => {
          state.downloads.push(url);
          state.existing.add(dest);
          state.versions.set(dest, OPENGREP_VERSION);
        },
        hashFile: async () => {
          attempt += 1;
          return attempt === 1 ? 'deadbeef' : CHECKSUMS.opengrep_musllinux_x86;
        },
      },
    });
    expect((await engine.resolve()).path).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(2);
    expect(state.downloads[1]).toContain('musllinux');
  });

  it('throws EngineUnavailableError when the download fails', async () => {
    const state = baseState();
    state.downloadImpl = async () => {
      throw new Error('network down');
    };
    const engine = manager(state);
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);
  });

  it('emits a single friendly download notice to the log', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const messages: string[] = [];
    const engine = manager(state, { log: (m) => messages.push(m) });
    await engine.resolve();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain(
      'Downloading the OAuthLint scan engine (Opengrep, ~41 MB, one time)',
    );
  });

  it('memoises a successful resolution (no second download)', async () => {
    const state = baseState();
    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    const engine = manager(state);
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
    const engine = manager(state, {
      deps: {
        download: async (url, dest) => {
          state.downloads.push(url);
          signalStarted();
          await gate;
          state.existing.add(dest);
          state.versions.set(dest, OPENGREP_VERSION);
        },
      },
    });
    const a = engine.resolve();
    const b = engine.resolve();
    await started;
    release();
    expect((await a).path).toBe(cachedBinary);
    expect((await b).path).toBe(cachedBinary);
    expect(state.downloads).toHaveLength(1);
  });

  it('reset() clears a failed resolution so it can be retried', async () => {
    const state = baseState();
    state.downloadImpl = async () => {
      throw new Error('offline');
    };
    const engine = manager(state);
    await expect(engine.resolve()).rejects.toBeInstanceOf(EngineUnavailableError);

    state.downloadImpl = async (_url, dest) => {
      state.existing.add(dest);
      state.versions.set(dest, OPENGREP_VERSION);
    };
    engine.reset();
    expect((await engine.resolve()).path).toBe(cachedBinary);
  });
});
