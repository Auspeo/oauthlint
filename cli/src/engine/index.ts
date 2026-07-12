import { EngineManager, type ResolvedEngine } from './manager.js';

export {
  EngineManager,
  EngineUnavailableError,
  type EngineDeps,
  type EngineKind,
  type EngineManagerOptions,
  type EngineSource,
  type ResolvedEngine,
} from './manager.js';

// The engine pins are the single source of truth shared with the VS Code
// extension (which imports them from the published `oauthlint` package).
export {
  OPENGREP_VERSION,
  RELEASE_BASE,
  assetUrl,
  ASSETS,
  CHECKSUMS,
  type AssetChoice,
} from './pins.js';

/**
 * A `--engine <path>` override set once from the CLI entrypoint. It takes
 * precedence over the `OAUTHLINT_ENGINE` environment variable. Stored at module
 * scope because a single process is a single CLI invocation, and every scan
 * path in that invocation must resolve the same engine.
 */
let engineOverride: string | undefined;

/** Record the `--engine <path>` flag (called once, from the CLI entrypoint). */
export function setEngineOverride(path: string | undefined): void {
  engineOverride = path?.trim() || undefined;
}

let shared: EngineManager | null = null;

/**
 * The process-wide engine manager. Lazily created so the download/cache logic
 * only runs when a real scan needs it, and shared so `planFixes` + `scan` in one
 * invocation resolve (and download) the engine at most once.
 */
export function getEngineManager(): EngineManager {
  if (!shared) {
    shared = new EngineManager({
      getEnginePath: () => engineOverride ?? process.env.OAUTHLINT_ENGINE,
    });
  }
  return shared;
}

/** Resolve the scan engine, downloading and caching Opengrep on first use. */
export function resolveEngine(): Promise<ResolvedEngine> {
  return getEngineManager().resolve();
}
