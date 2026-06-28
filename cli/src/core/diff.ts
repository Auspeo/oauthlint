import pc from 'picocolors';

/**
 * Minimal, dependency-free line-based unified diff.
 *
 * OAuthLint's autofixes are small, local literal replacements, so a clear
 * unified diff is the right preview for `--fix-dry-run`. Rather than pull in a
 * diff dependency, we compute a longest-common-subsequence (LCS) line diff and
 * render it in standard unified format (`--- a/… / +++ b/… / @@ … @@`), which
 * editors, reviewers, and `git apply` all understand.
 */

export interface UnifiedDiffOptions {
  /** Lines of unchanged context to show around each change (default 3). */
  context?: number;
  /** Colorize `+`/`-`/`@@` lines for a TTY (default false). */
  color?: boolean;
}

type Tag = ' ' | '-' | '+';
interface Entry {
  tag: Tag;
  /** 0-based line index in the original (-1 for an inserted line). */
  a: number;
  /** 0-based line index in the fixed text (-1 for a deleted line). */
  b: number;
  text: string;
}

/**
 * LCS line diff. Returns the full annotated sequence of lines in output order,
 * each tagged ` ` (unchanged), `-` (removed) or `+` (added).
 */
function diffLines(a: string[], b: string[]): Entry[] {
  const m = a.length;
  const n = b.length;
  // dp[i][j] = length of the LCS of a[i:] and b[j:].
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: Entry[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ tag: ' ', a: i, b: j, text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ tag: '-', a: i, b: -1, text: a[i] });
      i++;
    } else {
      out.push({ tag: '+', a: -1, b: j, text: b[j] });
      j++;
    }
  }
  while (i < m) out.push({ tag: '-', a: i++, b: -1, text: a[i - 1] });
  while (j < n) out.push({ tag: '+', a: -1, b: j++, text: b[j - 1] });
  return out;
}

interface Hunk {
  aStart: number;
  aLen: number;
  bStart: number;
  bLen: number;
  entries: Entry[];
}

/** Group changes into unified hunks, padding each with `context` lines. */
function buildHunks(entries: Entry[], context: number): Hunk[] {
  const changed = entries.map((e, idx) => (e.tag === ' ' ? -1 : idx)).filter((idx) => idx >= 0);
  if (changed.length === 0) return [];

  // Cluster changed-line indices that sit within 2*context of each other so
  // adjacent edits share one hunk rather than producing overlapping context.
  const clusters: [number, number][] = [];
  let start = changed[0];
  let prev = changed[0];
  for (const idx of changed.slice(1)) {
    if (idx - prev > context * 2) {
      clusters.push([start, prev]);
      start = idx;
    }
    prev = idx;
  }
  clusters.push([start, prev]);

  return clusters.map(([lo, hi]) => {
    const from = Math.max(0, lo - context);
    const to = Math.min(entries.length - 1, hi + context);
    const slice = entries.slice(from, to + 1);
    const aLines = slice.filter((e) => e.tag !== '+');
    const bLines = slice.filter((e) => e.tag !== '-');
    // Unified headers are 1-based; an empty side is reported as start 0.
    const aStart = aLines.length ? aLines[0].a + 1 : 0;
    const bStart = bLines.length ? bLines[0].b + 1 : 0;
    return { aStart, aLen: aLines.length, bStart, bLen: bLines.length, entries: slice };
  });
}

/**
 * Render a unified diff between `original` and `fixed`. Returns an empty string
 * when the two are identical, so callers can cheaply skip unchanged files.
 */
export function unifiedDiff(
  label: string,
  original: string,
  fixed: string,
  opts: UnifiedDiffOptions = {},
): string {
  if (original === fixed) return '';
  const context = opts.context ?? 3;
  const paint = opts.color
    ? { add: pc.green, del: pc.red, head: pc.cyan, hunk: pc.dim }
    : {
        add: (s: string) => s,
        del: (s: string) => s,
        head: (s: string) => s,
        hunk: (s: string) => s,
      };

  // Splitting on '\n' yields a trailing '' for a file that ends in a newline;
  // diffing the arrays directly handles that without special-casing.
  const a = original.split('\n');
  const b = fixed.split('\n');
  const entries = diffLines(a, b);
  const hunks = buildHunks(entries, context);
  if (hunks.length === 0) return '';

  // `a/`+`b/` prefixes follow git's unified-diff convention. An absolute label
  // already starts with `/`, so don't add a second slash.
  const sep = label.startsWith('/') ? '' : '/';
  const lines: string[] = [paint.head(`--- a${sep}${label}`), paint.head(`+++ b${sep}${label}`)];
  for (const h of hunks) {
    lines.push(paint.hunk(`@@ -${h.aStart},${h.aLen} +${h.bStart},${h.bLen} @@`));
    for (const e of h.entries) {
      if (e.tag === '+') lines.push(paint.add(`+${e.text}`));
      else if (e.tag === '-') lines.push(paint.del(`-${e.text}`));
      else lines.push(` ${e.text}`);
    }
  }
  return `${lines.join('\n')}\n`;
}
