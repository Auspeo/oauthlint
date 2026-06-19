/**
 * Pre-computed manifest entry-point used by consumers that want
 * the rule list without filesystem access (e.g. browser docs site).
 *
 * The actual manifest is generated at build time by `scripts/generate-manifest.ts`
 * (added in Sprint 1.2). For now, consumers should call `buildManifest()`
 * directly from `./loader.js`.
 */
export { buildManifest, type RuleManifestEntry } from './loader.js';
