import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { request as httpsRequest } from 'node:https';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import pc from 'picocolors';

/**
 * A minimal, dependency-free "newer version available" notifier — the same
 * idea as npm/eslint, kept deliberately small so it adds no transitive
 * supply-chain surface (we don't pull in the `update-notifier` tree).
 *
 * Hard guarantees:
 *  - NEVER blocks or delays the command. The check is fire-and-forget against a
 *    ~24h cache; the network call has a short timeout and ALL errors are
 *    swallowed (offline is completely silent).
 *  - Writes ONLY to stderr, never stdout — so `--json` / `--format sarif`
 *    piping is never corrupted.
 *  - Suppressed whenever output is machine-readable, stderr isn't a TTY, a CI
 *    env is detected, `NO_UPDATE_NOTIFIER` is set, or the user opted out.
 */

/** Package name on the npm registry. */
const PACKAGE_NAME = 'oauthlint';
/** How long a cached registry answer is trusted before we re-check. */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
/** Network timeout — short, so a slow/blocked registry never stalls the CLI. */
const NETWORK_TIMEOUT_MS = 2500;

export interface NotifierCache {
  /** Epoch ms of the last successful registry check. */
  lastCheck: number;
  /** The latest version string the registry reported, or null on failure. */
  latestVersion: string | null;
}

export interface UpdateNotifierOptions {
  /** Currently-installed version (from package.json). */
  currentVersion: string;
  /** True when the command emits machine-readable output (json/sarif). */
  machineReadable?: boolean;
  /** Explicit opt-out (e.g. `--no-update-check` or config). */
  disabled?: boolean;
  /** Streams/env are injected so tests stay deterministic and offline. */
  stderr?: NodeJS.WriteStream & { isTTY?: boolean };
  env?: NodeJS.ProcessEnv;
  /** Override the cache file location (tests). */
  cachePath?: string;
  /** Inject the registry fetch + clock (tests). */
  fetchLatest?: (name: string, timeoutMs: number) => Promise<string | null>;
  now?: () => number;
}

/**
 * Decide whether a notice may be shown at all, independent of versions.
 * Cheap, synchronous, and the single source of truth for suppression.
 */
export function shouldCheckForUpdate(opts: {
  machineReadable?: boolean;
  disabled?: boolean;
  stderr?: { isTTY?: boolean };
  env?: NodeJS.ProcessEnv;
}): boolean {
  const env = opts.env ?? process.env;
  if (opts.disabled) return false;
  if (opts.machineReadable) return false;
  // Explicit kill-switch honoured by the whole ecosystem.
  if (env.NO_UPDATE_NOTIFIER) return false;
  // Any common CI signal — never nag automated runs.
  if (isCI(env)) return false;
  // Piped / redirected stderr: the notice would land in a log or get mangled.
  const stderr = opts.stderr ?? process.stderr;
  if (!stderr.isTTY) return false;
  return true;
}

function isCI(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    env.CI ||
      env.CONTINUOUS_INTEGRATION ||
      env.BUILD_NUMBER ||
      env.GITHUB_ACTIONS ||
      env.GITLAB_CI ||
      env.CIRCLECI ||
      env.TRAVIS ||
      env.JENKINS_URL ||
      env.TEAMCITY_VERSION ||
      env.BITBUCKET_BUILD_NUMBER,
  );
}

/** Default cache location: XDG_CACHE_HOME, else ~/.cache. */
export function defaultCachePath(env: NodeJS.ProcessEnv = process.env): string {
  const base = env.XDG_CACHE_HOME?.trim() || join(homedir(), '.cache');
  return join(base, 'oauthlint', 'update-check.json');
}

async function readCache(path: string): Promise<NotifierCache | null> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as NotifierCache).lastCheck === 'number'
    ) {
      const c = parsed as NotifierCache;
      const v = c.latestVersion;
      // Validate the cached version: only accept null or a sane semver-ish
      // string. Never trust arbitrary content (defends against a tampered file).
      if (v === null || (typeof v === 'string' && isValidVersion(v))) {
        return { lastCheck: c.lastCheck, latestVersion: v };
      }
    }
  } catch {
    /* missing/corrupt cache → treat as no cache */
  }
  return null;
}

async function writeCache(path: string, cache: NotifierCache): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(cache), 'utf8');
  } catch {
    /* best-effort: a read-only home must never break the command */
  }
}

/**
 * Fetch the latest published version from the npm registry.
 * Hits the lightweight dist-tags endpoint, validates the response, and returns
 * null on any error/timeout. Nothing from the response is ever executed.
 */
export function fetchLatestVersion(
  name: string,
  timeoutMs: number = NETWORK_TIMEOUT_MS,
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: string | null): void => {
      if (settled) return;
      settled = true;
      resolve(v);
    };

    const req = httpsRequest(
      {
        method: 'GET',
        hostname: 'registry.npmjs.org',
        path: `/-/package/${encodeURIComponent(name)}/dist-tags`,
        headers: { accept: 'application/json' },
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          done(null);
          return;
        }
        let body = '';
        let size = 0;
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          size += chunk.length;
          // Cap the response we'll buffer — defensive against a hostile/huge body.
          if (size > 64 * 1024) {
            req.destroy();
            done(null);
            return;
          }
          body += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(body) as { latest?: unknown };
            const latest = json.latest;
            done(typeof latest === 'string' && isValidVersion(latest) ? latest : null);
          } catch {
            done(null);
          }
        });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      done(null);
    });
    req.on('error', () => done(null));
    req.end();
  });
}

/**
 * Run the update check and, when appropriate, print a single notice to stderr.
 * Designed to be awaited right before the process exits so the notice appears
 * AFTER the command's normal output and never interleaves.
 *
 * It resolves to the notice string it printed (or null), which is handy for
 * tests; production callers can ignore the return value.
 */
export async function maybeNotifyUpdate(opts: UpdateNotifierOptions): Promise<string | null> {
  const env = opts.env ?? process.env;
  const stderr = opts.stderr ?? process.stderr;

  if (
    !shouldCheckForUpdate({
      machineReadable: opts.machineReadable,
      disabled: opts.disabled,
      stderr,
      env,
    })
  ) {
    return null;
  }

  // A bad/dev version (e.g. '0.0.0') can't be meaningfully compared.
  if (!isValidVersion(opts.currentVersion)) return null;

  const now = opts.now ?? Date.now;
  const cachePath = opts.cachePath ?? defaultCachePath(env);
  const fetchLatest = opts.fetchLatest ?? fetchLatestVersion;

  try {
    const cache = await readCache(cachePath);
    let latest = cache?.latestVersion ?? null;

    const fresh = cache !== null && now() - cache.lastCheck < CHECK_INTERVAL_MS;
    if (!fresh) {
      // Cache is stale or absent → check the registry, then persist the answer
      // (and the timestamp) so we don't hit the network again for ~24h.
      latest = await fetchLatest(PACKAGE_NAME, NETWORK_TIMEOUT_MS);
      await writeCache(cachePath, { lastCheck: now(), latestVersion: latest });
    }

    if (!latest || !isValidVersion(latest)) return null;
    if (compareSemver(latest, opts.currentVersion) <= 0) return null;

    const notice = formatNotice(opts.currentVersion, latest);
    stderr.write(`${notice}\n`);
    return notice;
  } catch {
    // Belt-and-braces: nothing here may ever surface to the user.
    return null;
  }
}

function formatNotice(current: string, latest: string): string {
  const headline = `${pc.dim('Update available')} ${pc.dim(current)} ${pc.dim('→')} ${pc.green(latest)}`;
  const upgrade = `Run ${pc.cyan('npm i -g oauthlint')} ${pc.dim('(or')} ${pc.cyan('npx oauthlint@latest')}${pc.dim(')')}`;
  const optOut = pc.dim('Disable: --no-update-check or NO_UPDATE_NOTIFIER=1');
  return `\n${headline}\n${upgrade}\n${optOut}`;
}

// ---------------------------------------------------------------------------
// Semver: a tiny, self-contained comparator. Enough for "is latest > current",
// including basic prerelease ordering, without a dependency.
// ---------------------------------------------------------------------------

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function isValidVersion(v: string): boolean {
  return VERSION_RE.test(v.trim());
}

/**
 * Compare two semver strings. Returns >0 if a>b, <0 if a<b, 0 if equal.
 * Honours prerelease precedence (1.0.0-rc < 1.0.0) per the semver spec's
 * common cases. Invalid input sorts as "not greater" so we never nag wrongly.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;

  for (let i = 0; i < 3; i++) {
    if (pa.main[i] !== pb.main[i]) return pa.main[i] - pb.main[i];
  }

  // Equal core. A version WITH a prerelease is lower than one without.
  if (pa.pre.length === 0 && pb.pre.length === 0) return 0;
  if (pa.pre.length === 0) return 1; // a is a release, b is a prerelease
  if (pb.pre.length === 0) return -1; // a is a prerelease, b is a release

  const len = Math.max(pa.pre.length, pb.pre.length);
  for (let i = 0; i < len; i++) {
    const x = pa.pre[i];
    const y = pb.pre[i];
    if (x === undefined) return -1; // shorter prerelease set has lower precedence
    if (y === undefined) return 1;
    if (x === y) continue;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) return Number(x) - Number(y);
    if (xn) return -1; // numeric identifiers are lower than alphanumeric
    if (yn) return 1;
    return x < y ? -1 : 1; // lexical ASCII order
  }
  return 0;
}

function parseVersion(v: string): { main: [number, number, number]; pre: string[] } | null {
  const m = VERSION_RE.exec(v.trim());
  if (!m) return null;
  return {
    main: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre: m[4] ? m[4].split('.') : [],
  };
}
