/**
 * Render a source code frame around a finding — a few lines of context with a
 * dim line-number gutter and an accent caret under the matched span, in the
 * style of ESLint, ruff, cargo, and Biome.
 *
 * This module is intentionally pure (no filesystem, no global colour state): it
 * takes the source text plus a 1-based span and returns the frame as an array
 * of lines (no trailing newline). The caller is responsible for reading and
 * caching files and for choosing the colour functions, which keeps the renderer
 * trivially unit-testable.
 */

export interface CodeFrameSpan {
  /** 1-based line where the match starts. */
  startLine: number;
  /** 1-based line where the match ends (defaults to `startLine`). */
  endLine?: number;
  /** 1-based column where the match starts. */
  startCol: number;
  /** 1-based, exclusive column where the match ends. */
  endCol: number;
}

export interface CodeFrameOptions {
  /** Accent colour for the offending line's gutter and the caret span. */
  accent: (s: string) => string;
  /** Dim colour for context lines and the gutter chrome. */
  dim: (s: string) => string;
  /** Lines of context to show above and below the offending line. Default 2. */
  contextLines?: number;
  /** Max rendered width before a line is truncated with an ellipsis. Default 100. */
  maxWidth?: number;
}

const GUTTER_SEP = '│';
const POINTER = '›';
const ELLIPSIS = '…';

/**
 * Build the code frame. Returns an empty array (caller should then skip the
 * frame and keep the plain `file:line`) when the span can't be rendered — the
 * start line is out of range, or the columns are non-positive.
 */
export function renderCodeFrame(
  source: string,
  span: CodeFrameSpan,
  opts: CodeFrameOptions,
): string[] {
  const { accent, dim } = opts;
  const context = opts.contextLines ?? 2;
  const maxWidth = opts.maxWidth ?? 100;

  // Split without a trailing empty element so a final newline doesn't invent a
  // phantom blank line at the end of the file.
  const lines = source.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const startLine = span.startLine;
  const endLine = Math.max(span.endLine ?? startLine, startLine);
  if (startLine < 1 || startLine > lines.length) return [];
  if (span.startCol < 1 || span.endCol < 1) return [];

  const firstShown = Math.max(1, startLine - context);
  const lastShown = Math.min(lines.length, endLine + context);

  // Gutter width is sized to the largest line number in the visible window.
  const gutterWidth = String(lastShown).length;
  // " <gutter> │ " — pointer (1) + space + gutter + space + sep + space.
  const chromeWidth = 2 + gutterWidth + 1 + GUTTER_SEP.length + 1;
  const contentBudget = Math.max(8, maxWidth - chromeWidth);

  const out: string[] = [];
  for (let n = firstShown; n <= lastShown; n++) {
    const isOffending = n >= startLine && n <= endLine;
    // Tabs are rendered as a single space so each source character maps to one
    // display column — that keeps the caret aligned (Semgrep counts a tab as
    // one column too) without expanding indentation unpredictably.
    const raw = (lines[n - 1] ?? '').replace(/\t/g, ' ');
    const { text, truncated } = truncate(raw, contentBudget);

    const num = String(n).padStart(gutterWidth, ' ');
    const pointer = isOffending ? accent(POINTER) : ' ';
    const gutter = isOffending ? accent(num) : dim(num);
    const sep = dim(GUTTER_SEP);
    out.push(`${pointer} ${gutter} ${sep} ${text}`);

    // Draw the caret under the start line only (a single, tasteful marker even
    // for multi-line matches). The caret spans from startCol to endCol, clamped
    // to what's actually visible after truncation.
    if (n === startLine) {
      const caret = caretLine(raw.length, span, truncated ? contentBudget : raw.length, accent);
      if (caret) {
        const pad = ' '.repeat(gutterWidth);
        out.push(`  ${pad} ${dim(GUTTER_SEP)} ${caret}`);
      }
    }
  }
  return out;
}

/** Truncate to `budget` display columns, replacing the tail with an ellipsis. */
function truncate(line: string, budget: number): { text: string; truncated: boolean } {
  if (line.length <= budget) return { text: line, truncated: false };
  return { text: `${line.slice(0, Math.max(0, budget - 1))}${ELLIPSIS}`, truncated: true };
}

/**
 * Build the caret underline: leading spaces up to the match start, then a run
 * of `^` in the accent colour. `visibleLen` caps the caret to the truncated
 * line width so it never points past the visible text or wraps.
 */
function caretLine(
  rawLen: number,
  span: CodeFrameSpan,
  visibleLen: number,
  accent: (s: string) => string,
): string | null {
  const startCol = span.startCol;
  // End column is exclusive; for a multi-line match underline to end of line.
  const endCol = (span.endLine ?? span.startLine) > span.startLine ? rawLen + 1 : span.endCol;

  const startIdx = Math.max(0, startCol - 1);
  if (startIdx >= visibleLen) return null; // match begins past the visible text

  const endIdx = Math.min(Math.max(endCol - 1, startCol), visibleLen);
  const width = Math.max(1, endIdx - startIdx);
  return ' '.repeat(startIdx) + accent('^'.repeat(width));
}
