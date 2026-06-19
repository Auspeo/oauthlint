import { readFile } from 'node:fs/promises';
import type { Finding } from '../types.js';

/**
 * Inline suppression directives recognised by OAuthLint.
 *
 * `oauthlint-disable-next-line <rule-id> [-- <reason>]`
 *   Suppress findings on the immediately following line. The rule id is
 *   required (we don't support blanket "disable everything" because it
 *   silently hides future findings — bad smell). The reason is optional
 *   but encouraged.
 *
 * `oauthlint-disable-line <rule-id> [-- <reason>]`
 *   Same, but applies to the current line (the line the comment is on).
 *
 * `oauthlint-disable-file <rule-id> [-- <reason>]`
 *   Disable the rule for the entire file. Goes anywhere in the file.
 *
 * Glob `*` is accepted as a rule id placeholder for the wildcard case,
 * but ONLY for `oauthlint-disable-next-line` / `disable-line` (not
 * disable-file) so that wholesale silencing requires an explicit
 * line-by-line decision.
 */

interface SuppressionMaps {
  /** rule id (or '*') → set of zero-based line numbers to suppress */
  byLine: Map<string, Set<number>>;
  /** rule ids (or '*') suppressed for the whole file */
  fileWide: Set<string>;
}

const DIRECTIVE_RE = /oauthlint-disable-(next-line|line|file)\s+([a-z0-9.*-]+)(?:\s*--\s*(.+))?/i;

export async function loadSuppressionMap(filePath: string): Promise<SuppressionMaps> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    return { byLine: new Map(), fileWide: new Set() };
  }
  return parseSuppressionsFromSource(text);
}

export function parseSuppressionsFromSource(source: string): SuppressionMaps {
  const byLine = new Map<string, Set<number>>();
  const fileWide = new Set<string>();
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]?.match(DIRECTIVE_RE);
    if (!match) continue;
    const kind = match[1]?.toLowerCase();
    const ruleId = match[2]?.toLowerCase();
    if (!kind || !ruleId) continue;

    if (kind === 'file') {
      if (ruleId === '*') {
        // We deliberately don't let `disable-file *` work — see comment above.
        continue;
      }
      fileWide.add(ruleId);
      continue;
    }

    // disable-line: same line; disable-next-line: i + 1
    const target = kind === 'line' ? i : i + 1;
    let set = byLine.get(ruleId);
    if (!set) {
      set = new Set();
      byLine.set(ruleId, set);
    }
    set.add(target);
  }

  return { byLine, fileWide };
}

export function isSuppressed(finding: Finding, maps: SuppressionMaps): boolean {
  if (maps.fileWide.has(finding.ruleId) || maps.fileWide.has('*')) {
    return true;
  }
  // Semgrep returns 1-based start lines; our suppression map is 0-based
  // because we walk the source array with for-loops.
  const lineIdx = finding.startLine - 1;
  for (const id of [finding.ruleId, '*']) {
    const lines = maps.byLine.get(id);
    if (lines?.has(lineIdx)) return true;
  }
  return false;
}

/**
 * Apply suppression to a list of findings. Caches the parsed directive
 * map per-file so we only read each file once.
 */
export async function applySuppressions(findings: Finding[]): Promise<{
  kept: Finding[];
  suppressed: Finding[];
}> {
  const cache = new Map<string, SuppressionMaps>();
  const kept: Finding[] = [];
  const suppressed: Finding[] = [];

  for (const f of findings) {
    let maps = cache.get(f.filePath);
    if (!maps) {
      maps = await loadSuppressionMap(f.filePath);
      cache.set(f.filePath, maps);
    }
    if (isSuppressed(f, maps)) {
      suppressed.push(f);
    } else {
      kept.push(f);
    }
  }
  return { kept, suppressed };
}
