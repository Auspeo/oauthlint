import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access, chmod, mkdir, rename, rm } from 'node:fs/promises';
import { get } from 'node:https';
import { delimiter, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * The Opengrep release this extension pins. Opengrep is a Python-free,
 * single-file, Semgrep-compatible engine; pinning the version keeps scans
 * reproducible and lets the cache key on the exact binary we verified.
 */
export const OPENGREP_VERSION = '1.25.0';

const RELEASE_BASE = `https://github.com/opengrep/opengrep/releases/download/v${OPENGREP_VERSION}`;

/**
 * Maps `${process.platform}/${process.arch}` to the Opengrep release asset for
 * that platform. Linux entries carry a musl fallback used only when the default
 * (glibc / manylinux) binary fails to run on the host.
 */
interface AssetChoice {
  /** Primary asset name (glibc on Linux). */
  primary: string;
  /** Optional musl fallback, tried only if the primary binary won't run. */
  fallback?: string;
}

const ASSETS: Record<string, AssetChoice> = {
  'darwin/arm64': { primary: 'opengrep_osx_arm64' },
  'darwin/x64': { primary: 'opengrep_osx_x86' },
  'linux/arm64': { primary: 'opengrep_manylinux_aarch64', fallback: 'opengrep_musllinux_aarch64' },
  'linux/x64': { primary: 'opengrep_manylinux_x86', fallback: 'opengrep_musllinux_x86' },
  'win32/x64': { primary: 'opengrep_windows_x86.exe' },
};

/**
 * Thrown when the scan engine cannot be resolved: an unsupported platform, a
 * failed download, or a binary that will not run. The message is user-facing and
 * actionable; the VS Code layer surfaces it with Retry and Docs actions and
 * never crashes activation over it.
 */
export class EngineUnavailableError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = 'EngineUnavailableError';
  }
}

/**
 * The side-effecting ports the manager needs. Bundled behind an interface so
 * tests can supply fast, offline fakes (no real network, filesystem, or child
 * processes) while production uses the Node built-ins below.
 */
export interface EngineDeps {
  platform: NodeJS.Platform;
  arch: string;
  /** Resolve true when a path exists and is readable. */
  pathExists(path: string): Promise<boolean>;
  /** Recursively create a directory. */
  mkdirp(path: string): Promise<void>;
  /** Mark a file executable (0o755). No-op-safe on Windows. */
  makeExecutable(path: string): Promise<void>;
  /** Run `<binary> --version` and return its first trimmed line, or null on failure. */
  runVersion(binary: string): Promise<string | null>;
  /** Locate an `opengrep` executable on PATH, or null. */
  whichOpengrep(): Promise<string | null>;
  /** Download `url` to `dest` (atomically), reporting byte progress. */
  download(
    url: string,
    dest: string,
    onProgress?: (received: number, total: number) => void,
  ): Promise<void>;
}

export interface EngineManagerOptions {
  /** Cache root — the extension's `globalStorageUri.fsPath`. */
  globalStorageDir: string;
  /** Reads the current `oauthlint.enginePath` setting (empty/undefined = auto). */
  getEnginePath?: () => string | undefined;
  /**
   * Wrap the download so the host can show progress UI. Called only when a
   * download actually happens. Defaults to running the work with a no-op
   * reporter. Returns a `PromiseLike` so VS Code's `Thenable`-returning
   * `withProgress` slots in directly.
   */
  withDownloadUI?: <T>(run: (report: (message: string) => void) => Promise<T>) => PromiseLike<T>;
  /** Overrides for the side-effecting ports (tests supply fakes). */
  deps?: Partial<EngineDeps>;
}

/**
 * Resolves the scan engine binary, downloading and caching Opengrep on first
 * use. A single in-flight promise guards against concurrent scans triggering
 * parallel downloads, and a successful resolution is memoised so later scans
 * pay nothing. `reset()` clears the memo so a failed first run can be retried.
 */
export class EngineManager {
  private readonly deps: EngineDeps;
  private readonly getEnginePath: () => string | undefined;
  private readonly withDownloadUI: NonNullable<EngineManagerOptions['withDownloadUI']>;
  private readonly versionDir: string;
  private readonly binaryPath: string;

  private resolved: string | null = null;
  private inflight: Promise<string> | null = null;

  constructor(opts: EngineManagerOptions) {
    this.deps = { ...defaultDeps(), ...opts.deps };
    this.getEnginePath = opts.getEnginePath ?? (() => undefined);
    this.withDownloadUI = opts.withDownloadUI ?? ((run) => run(() => {}));
    this.versionDir = join(opts.globalStorageDir, 'opengrep', `v${OPENGREP_VERSION}`);
    this.binaryPath = join(
      this.versionDir,
      this.deps.platform === 'win32' ? 'opengrep.exe' : 'opengrep',
    );
  }

  /**
   * Resolve a usable engine binary path. Order: an explicit `enginePath`
   * setting, then the pinned cached binary, then an `opengrep` on PATH, then a
   * fresh download. Concurrent callers share one in-flight resolution.
   *
   * @throws EngineUnavailableError if no engine can be obtained.
   */
  async resolve(): Promise<string> {
    if (this.resolved) return this.resolved;
    if (this.inflight) return this.inflight;
    this.inflight = this.doResolve().then(
      (path) => {
        this.resolved = path;
        this.inflight = null;
        return path;
      },
      (err) => {
        this.inflight = null;
        throw err;
      },
    );
    return this.inflight;
  }

  /** Forget a prior (successful or failed) resolution so the next call re-runs. */
  reset(): void {
    this.resolved = null;
    this.inflight = null;
  }

  private async doResolve(): Promise<string> {
    // 1. Explicit user override — trust it, only check that it exists on disk.
    const override = this.getEnginePath()?.trim();
    if (override) {
      if (await this.deps.pathExists(override)) return override;
      throw new EngineUnavailableError(
        `The configured oauthlint.enginePath does not exist: ${override}. Point it at an installed opengrep or semgrep binary, or clear the setting to download the engine automatically.`,
      );
    }

    // 2. Already-downloaded, version-matched cache.
    if (await this.deps.pathExists(this.binaryPath)) {
      if (await this.isPinnedVersion(this.binaryPath)) return this.binaryPath;
    }

    // 3. An opengrep already on PATH (user-managed install).
    const onPath = await this.deps.whichOpengrep();
    if (onPath && (await this.deps.runVersion(onPath))) return onPath;

    // 4. Download the pinned binary for this platform.
    return this.downloadEngine();
  }

  /** True when `binary --version` reports the pinned Opengrep version. */
  private async isPinnedVersion(binary: string): Promise<boolean> {
    const version = await this.deps.runVersion(binary);
    return version === OPENGREP_VERSION;
  }

  private async downloadEngine(): Promise<string> {
    const key = `${this.deps.platform}/${this.deps.arch}`;
    const choice = ASSETS[key];
    if (!choice) {
      throw new EngineUnavailableError(
        `OAuthLint has no bundled scan engine for this platform (${key}). Install opengrep or semgrep and set oauthlint.enginePath to its location.`,
      );
    }

    await this.deps.mkdirp(this.versionDir);

    return this.withDownloadUI(async (report) => {
      report('Downloading the OAuthLint scan engine (~41 MB, one time)…');
      // Try the primary asset; on Linux fall back to the musl build if the
      // glibc binary downloads but will not run on this host.
      const assets = choice.fallback ? [choice.primary, choice.fallback] : [choice.primary];
      let lastError = '';
      for (const asset of assets) {
        try {
          await this.fetchAndVerify(asset, report);
          return this.binaryPath;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      throw new EngineUnavailableError(
        `Could not download the OAuthLint scan engine for ${key}: ${lastError}. Check your network connection and retry, or set oauthlint.enginePath to an installed opengrep/semgrep binary.`,
      );
    });
  }

  /** Download one asset into the cache, make it executable, and verify it runs the pinned version. */
  private async fetchAndVerify(asset: string, report: (message: string) => void): Promise<void> {
    const url = `${RELEASE_BASE}/${asset}`;
    report(`Downloading the OAuthLint scan engine (~41 MB, one time)… (${asset})`);
    await this.deps.download(url, this.binaryPath, (received, total) => {
      if (total > 0) {
        const pct = Math.floor((received / total) * 100);
        report(`Downloading the OAuthLint scan engine… ${pct}%`);
      }
    });
    await this.deps.makeExecutable(this.binaryPath);
    if (!(await this.isPinnedVersion(this.binaryPath))) {
      throw new Error(`downloaded engine did not report version ${OPENGREP_VERSION}`);
    }
  }
}

/** Production implementations of the side-effecting ports. */
function defaultDeps(): EngineDeps {
  return {
    platform: process.platform,
    arch: process.arch,
    async pathExists(path: string): Promise<boolean> {
      try {
        await access(path);
        return true;
      } catch {
        return false;
      }
    },
    async mkdirp(path: string): Promise<void> {
      await mkdir(path, { recursive: true });
    },
    async makeExecutable(path: string): Promise<void> {
      await chmod(path, 0o755);
    },
    async runVersion(binary: string): Promise<string | null> {
      try {
        // execFile never spawns a shell, so the binary path is not interpreted.
        const { stdout } = await execFileAsync(binary, ['--version'], { timeout: 20_000 });
        return stdout.split('\n')[0]?.trim() || null;
      } catch {
        return null;
      }
    },
    async whichOpengrep(): Promise<string | null> {
      const names = process.platform === 'win32' ? ['opengrep.exe', 'opengrep'] : ['opengrep'];
      const dirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
      for (const dir of dirs) {
        for (const name of names) {
          const candidate = join(dir, name);
          try {
            await access(candidate);
            return candidate;
          } catch {
            // Not here — keep scanning PATH.
          }
        }
      }
      return null;
    },
    download: downloadFile,
  };
}

/**
 * Download `url` to `dest` over HTTPS, following redirects (GitHub release
 * assets 302 to a CDN). Writes to a temporary sibling first and renames on
 * success so a partial download never masquerades as a complete binary.
 */
function downloadFile(
  url: string,
  dest: string,
  onProgress?: (received: number, total: number) => void,
): Promise<void> {
  const tmp = `${dest}.download`;
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const cleanupAndReject = (err: Error): void => {
      void rm(tmp, { force: true }).finally(() => rejectPromise(err));
    };

    const request = (current: string, redirectsLeft: number): void => {
      const req = get(current, (res) => {
        const status = res.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            cleanupAndReject(new Error('too many redirects'));
            return;
          }
          request(new URL(res.headers.location, current).toString(), redirectsLeft - 1);
          return;
        }
        if (status !== 200) {
          res.resume();
          cleanupAndReject(new Error(`HTTP ${status}`));
          return;
        }

        const total = Number(res.headers['content-length'] ?? 0);
        let received = 0;
        const out = createWriteStream(tmp);
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          onProgress?.(received, total);
        });
        res.on('error', cleanupAndReject);
        out.on('error', cleanupAndReject);
        out.on('finish', () => {
          out.close(() => {
            rename(tmp, dest).then(resolvePromise, cleanupAndReject);
          });
        });
        res.pipe(out);
      });
      req.on('error', cleanupAndReject);
    };

    request(url, 5);
  });
}
