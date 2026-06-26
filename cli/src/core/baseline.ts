import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import type { Finding } from '../types.js';

/**
 * Baseline support: capture the CURRENT set of findings so a team can adopt
 * OAuthLint on a large existing codebase and only be alerted on NEW issues.
 *
 * The hard requirement is a fingerprint that is stable across edits that move
 * a finding around without changing it: inserting an import, reformatting a
 * block, or shifting code down N lines must NOT resurface a baselined finding,
 * while genuinely changing the flagged code MUST surface it as new.
 *
 * Fingerprint = sha256 of three parts joined by NULs:
 *   1. the rule identity — `oauthlintRuleId` when present, else `ruleId`
 *   2. the repo/cwd-relative file path (POSIX separators, so it's portable)
 *   3. a NORMALISED snapshot of the matched source (the `startLine..endLine`
 *      span, whitespace-collapsed) — explicitly NOT the raw line numbers
 *
 * When the file can't be read (deleted, binary, permission error) we fall back
 * to the trimmed `message` as the snapshot so a fingerprint can still be
 * produced — degraded but deterministic, never a crash.
 *
 * Identical fingerprints within one file (e.g. the same anti-pattern repeated)
 * are disambiguated by a stable per-file occurrence index, assigned in source
 * order, so each physical finding maps to a distinct baseline entry.
 */

export const BASELINE_VERSION = 1 as const;
export const DEFAULT_BASELINE_FILE = '.oauthlint-baseline.json';

/** A single baselined finding, keyed by its stable fingerprint. */
export interface BaselineEntry {
  /** Stable fingerprint (see module docs). Survives line shifts. */
  fingerprint: string;
  /** Rule identity used in the hash — for human-diffability of the file. */
  ruleId: string;
  /** Repo/cwd-relative path used in the hash — for human-diffability. */
  filePath: string;
}

export interface BaselineFile {
  version: typeof BASELINE_VERSION;
  generatedAt: string;
  /** Sorted, deterministic list of baselined fingerprints. */
  findings: BaselineEntry[];
}

/** In-memory baseline: just the set of fingerprints we suppress against. */
export interface Baseline {
  fingerprints: Set<string>;
}

export class BaselineNotFoundError extends Error {
  constructor(path: string) {
    super(
      `Baseline file not found: ${path}\nCreate one first with: oauthlint baseline\n(an absent baseline is treated as an error, not an empty allow-list, so a typo never silently disables suppression).`,
    );
    this.name = 'BaselineNotFoundError';
  }
}

export class BaselineParseError extends Error {
  constructor(path: string, detail: string) {
    super(`Could not parse baseline file ${path}: ${detail}`);
    this.name = 'BaselineParseError';
  }
}

/** Collapse runs of whitespace and trim, so reformatting doesn't churn fingerprints. */
function normaliseSnippet(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Rule identity that goes into the hash — prefer the stable OAuthLint id. */
function ruleIdentity(finding: Finding): string {
  return finding.oauthlintRuleId ?? finding.ruleId;
}

/**
 * Turn a finding's `filePath` into a portable, repo/cwd-relative path with
 * POSIX separators. Absolute paths are made relative to `cwd`; paths that are
 * already relative are normalised as-is. We never let an absolute path leak
 * into a fingerprint, so a baseline is portable across machines/checkouts.
 */
export function toRelativePath(filePath: string, cwd: string): string {
  const rel = isAbsolute(filePath) ? relative(cwd, filePath) : filePath;
  return rel.split('\\').join('/');
}

/**
 * Read the matched source span for a finding and return it normalised. On any
 * read/decoding problem, fall back to the finding's message so we still get a
 * deterministic value rather than throwing.
 */
async function snapshotFor(
  finding: Finding,
  cwd: string,
  cache: Map<string, string[] | null>,
): Promise<string> {
  const abs = isAbsolute(finding.filePath) ? finding.filePath : resolve(cwd, finding.filePath);
  let lines = cache.get(abs);
  if (lines === undefined) {
    lines = await readLinesSafe(abs);
    cache.set(abs, lines);
  }
  if (lines === null) {
    // Unreadable (missing/binary/permission) — degrade to the message text.
    return normaliseSnippet(finding.message);
  }
  // Finding lines are 1-based and inclusive. Clamp into range defensively in
  // case the file changed between scan and fingerprinting.
  const start = Math.max(1, finding.startLine);
  const end = Math.max(start, finding.endLine);
  const span = lines.slice(start - 1, end).join('\n');
  const normalised = normaliseSnippet(span);
  // If the span is empty (out-of-range lines after a shrink), fall back so the
  // fingerprint is never the hash of an empty string for every such finding.
  return normalised || normaliseSnippet(finding.message);
}

/** Read a file as lines, returning null when it's missing or looks binary. */
async function readLinesSafe(absPath: string): Promise<string[] | null> {
  let buf: Buffer;
  try {
    buf = await readFile(absPath);
  } catch {
    return null;
  }
  // Treat NUL bytes as the binary signal (cheap, matches common heuristics).
  if (buf.includes(0)) return null;
  return buf.toString('utf8').split('\n');
}

function hash(parts: string[]): string {
  const h = createHash('sha256');
  // NUL separator can't appear in any of the parts (path/id are text, the
  // snippet has NULs stripped by the binary check), so there's no collision
  // between e.g. ["ab","c"] and ["a","bc"].
  h.update(parts.join('\0'));
  return h.digest('hex');
}

/**
 * Compute the stable fingerprint for a finding (without the occurrence index).
 * Two findings of the same rule on the same (relative) file with the same
 * normalised snippet share this value — they're disambiguated by the index
 * added in {@link fingerprintFindings}.
 */
export async function baseFingerprint(
  finding: Finding,
  cwd: string,
  cache: Map<string, string[] | null>,
): Promise<string> {
  const rel = toRelativePath(finding.filePath, cwd);
  const snippet = await snapshotFor(finding, cwd, cache);
  return hash([ruleIdentity(finding), rel, snippet]);
}

/** A finding paired with its final, occurrence-disambiguated fingerprint. */
export interface FingerprintedFinding {
  finding: Finding;
  fingerprint: string;
}

/**
 * Fingerprint a list of findings deterministically. Findings are processed in
 * a stable order, and identical base fingerprints within the run get an
 * occurrence index (`<base>:<n>`) so repeated anti-patterns each get a unique
 * key. The same input list always yields the same fingerprints.
 */
export async function fingerprintFindings(
  findings: Finding[],
  cwd: string,
): Promise<FingerprintedFinding[]> {
  const cache = new Map<string, string[] | null>();
  // Stable processing order so occurrence indices are reproducible regardless
  // of the adapter's emission order: by relative path, then line, then rule.
  const ordered = [...findings]
    .map((finding) => ({ finding, rel: toRelativePath(finding.filePath, cwd) }))
    .sort(
      (a, b) =>
        a.rel.localeCompare(b.rel) ||
        a.finding.startLine - b.finding.startLine ||
        a.finding.endLine - b.finding.endLine ||
        ruleIdentity(a.finding).localeCompare(ruleIdentity(b.finding)),
    );

  const seen = new Map<string, number>();
  const out: FingerprintedFinding[] = [];
  for (const { finding } of ordered) {
    const base = await baseFingerprint(finding, cwd, cache);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.push({ finding, fingerprint: `${base}:${n}` });
  }
  return out;
}

/**
 * Build a serialisable baseline file from a set of findings. The entry list is
 * sorted so the JSON is stable and human-diffable across runs.
 */
export async function buildBaseline(findings: Finding[], cwd: string): Promise<BaselineFile> {
  const fingerprinted = await fingerprintFindings(findings, cwd);
  const entries: BaselineEntry[] = fingerprinted.map(({ finding, fingerprint }) => ({
    fingerprint,
    ruleId: ruleIdentity(finding),
    filePath: toRelativePath(finding.filePath, cwd),
  }));
  entries.sort(
    (a, b) =>
      a.filePath.localeCompare(b.filePath) ||
      a.ruleId.localeCompare(b.ruleId) ||
      a.fingerprint.localeCompare(b.fingerprint),
  );
  return {
    version: BASELINE_VERSION,
    generatedAt: new Date().toISOString(),
    findings: entries,
  };
}

/** Serialise a baseline file to pretty JSON (trailing newline for clean diffs). */
export function serialiseBaseline(baseline: BaselineFile): string {
  return `${JSON.stringify(baseline, null, 2)}\n`;
}

/**
 * Load a baseline from disk into an in-memory fingerprint set.
 *
 * @throws BaselineNotFoundError when the file is absent — deliberately NOT
 *   treated as an empty allow-list, so a misspelt `--baseline path` fails loud
 *   instead of silently suppressing nothing (or everything).
 * @throws BaselineParseError when the file is present but malformed.
 */
export async function loadBaseline(path: string): Promise<Baseline> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new BaselineNotFoundError(path);
    }
    throw err;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new BaselineParseError(path, err instanceof Error ? err.message : String(err));
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as { findings?: unknown }).findings)
  ) {
    throw new BaselineParseError(path, 'expected an object with a "findings" array');
  }
  const fingerprints = new Set<string>();
  for (const entry of (parsed as BaselineFile).findings) {
    if (entry && typeof entry.fingerprint === 'string') {
      fingerprints.add(entry.fingerprint);
    }
  }
  return { fingerprints };
}

/**
 * Split findings into those already present in the baseline (suppressed) and
 * genuinely new ones, by fingerprinting and matching against the baseline set.
 */
export async function partitionByBaseline(
  findings: Finding[],
  baseline: Baseline,
  cwd: string,
): Promise<{ newFindings: Finding[]; baselined: Finding[] }> {
  const fingerprinted = await fingerprintFindings(findings, cwd);
  const newFindings: Finding[] = [];
  const baselined: Finding[] = [];
  for (const { finding, fingerprint } of fingerprinted) {
    if (baseline.fingerprints.has(fingerprint)) baselined.push(finding);
    else newFindings.push(finding);
  }
  return { newFindings, baselined };
}
