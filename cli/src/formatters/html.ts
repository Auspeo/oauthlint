import { readFile } from 'node:fs/promises';
import type { Finding, ScanResult, SeverityName } from '../types.js';

/**
 * Render a scan result as a single, self-contained HTML document.
 *
 * Design goals:
 * - **Self-contained**: all CSS is inlined; no external requests, no JavaScript.
 *   The file works opened straight from disk and prints cleanly.
 * - **Shareable audit artifact**: dark header, severity-coloured badges, a
 *   per-severity summary, and findings grouped by severity (worst first).
 * - **Safe**: EVERY interpolated value (paths, messages, rule ids, code
 *   snippets, scan target) is HTML-escaped via {@link escapeHtml}, so hostile
 *   source under scan — even a literal `</script>` or `<img onerror>` — is
 *   rendered as inert text and can never execute in the report.
 *
 * Output is deterministic given its inputs: the timestamp is injected (see
 * {@link HtmlReportOptions.generatedAt}) rather than read from the clock, so
 * the same scan always produces byte-identical HTML — which keeps tests stable.
 */

export interface HtmlReportOptions {
  /** The scan target(s) shown in the header (e.g. `./src` or a file list). */
  target: string;
  /**
   * Timestamp shown in the header. Injected for determinism; defaults to now.
   * Accepts a `Date` or a pre-formatted string.
   */
  generatedAt?: Date | string;
  /** Tool version, shown in the footer. */
  version?: string;
  /**
   * Best-effort source-snippet lookup. When omitted, snippets are read from
   * disk by {@link Finding.filePath}. Injectable so tests need no real files
   * and so the caller can supply already-resolved snippets. Return
   * `null`/`undefined` for "no snippet available".
   */
  readSnippet?: (filePath: string, startLine: number) => string | null | undefined;
}

const SEVERITY_ORDER: SeverityName[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

/**
 * HTML-escape a value for safe interpolation in element text OR attribute
 * context. Covers `&`, `<`, `>`, `"`, and `'` — the full set needed so that
 * neither markup nor an attribute-quote breakout is possible. `&` is replaced
 * first so the other entities aren't double-encoded.
 */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Return a URL only when it is a safe `http(s)` link, otherwise `null`.
 *
 * `escapeHtml` neutralises markup/attribute breakouts but NOT the scheme: a
 * `javascript:` (or `data:`) URL contains no HTML-significant characters, so it
 * would survive escaping and render as a live, executable `href`. Restricting
 * the scheme here is what actually prevents that XSS — callers must omit the
 * link when this returns `null`.
 */
export function safeHref(url: unknown): string | null {
  const s = String(url);
  return /^https?:\/\//i.test(s) ? s : null;
}

function severityCounts(findings: Finding[]): Record<SeverityName, number> {
  const counts: Record<SeverityName, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

/** Read the flagged source line from disk, best-effort. Never throws. */
async function defaultReadSnippet(filePath: string, startLine: number): Promise<string | null> {
  if (!filePath || startLine < 1) return null;
  try {
    const text = await readFile(filePath, 'utf8');
    const lines = text.split(/\r?\n/);
    return lines[startLine - 1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve a snippet for each finding up front (async disk reads), keyed by the
 * finding object, so the synchronous render pass below stays simple. The
 * injectable {@link HtmlReportOptions.readSnippet} short-circuits disk access.
 */
async function resolveSnippets(
  findings: Finding[],
  read: HtmlReportOptions['readSnippet'],
): Promise<Map<Finding, string | null>> {
  const out = new Map<Finding, string | null>();
  await Promise.all(
    findings.map(async (f) => {
      let snippet: string | null | undefined;
      if (read) {
        snippet = read(f.filePath, f.startLine);
      } else {
        snippet = await defaultReadSnippet(f.filePath, f.startLine);
      }
      out.set(f, snippet ?? null);
    }),
  );
  return out;
}

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1b2330;
    background: #f4f6fa;
    line-height: 1.5;
  }
  .wrap { max-width: 960px; margin: 0 auto; padding: 0 24px 64px; }
  header.report {
    background: #0f1729;
    color: #f4f6fa;
    padding: 32px 0;
    border-bottom: 4px solid #2f6feb;
  }
  header.report .wrap { padding-bottom: 0; }
  header.report h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: -0.01em; }
  header.report h1 .mark { color: #6ea8ff; }
  header.report .meta { margin: 12px 0 0; font-size: 13px; color: #9fb0c9; }
  header.report .meta code {
    background: rgba(255,255,255,0.08);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: #d6e2f5;
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 24px 0 8px;
  }
  .pill {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid transparent;
  }
  .pill .n { font-size: 15px; }
  .pill.total { background: #fff; border-color: #d7deea; color: #1b2330; }
  .badge, .pill {
    --crit-bg: #fde7e9; --crit-fg: #8a1020; --crit-bd: #f3b7c0;
    --high-bg: #fdecea; --high-fg: #a01b12; --high-bd: #f4bcb6;
    --med-bg:  #fff4e0; --med-fg:  #8a5a00; --med-bd:  #f3d79a;
    --low-bg:  #e8eefc; --low-fg:  #244a9c; --low-bd:  #c4d3f4;
    --info-bg: #eef1f5; --info-fg: #4a5568; --info-bd: #d4dae3;
  }
  .pill.CRITICAL { background: var(--crit-bg); color: var(--crit-fg); border-color: var(--crit-bd); }
  .pill.HIGH     { background: var(--high-bg); color: var(--high-fg); border-color: var(--high-bd); }
  .pill.MEDIUM   { background: var(--med-bg);  color: var(--med-fg);  border-color: var(--med-bd); }
  .pill.LOW      { background: var(--low-bg);  color: var(--low-fg);  border-color: var(--low-bd); }
  .pill.INFO     { background: var(--info-bg); color: var(--info-fg); border-color: var(--info-bd); }
  .group { margin-top: 32px; }
  .group > h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #5b6b85;
    border-bottom: 1px solid #dde3ed;
    padding-bottom: 8px;
    margin: 0 0 16px;
  }
  .finding {
    background: #fff;
    border: 1px solid #e2e7f0;
    border-left: 4px solid #c4d3f4;
    border-radius: 8px;
    padding: 16px 18px;
    margin-bottom: 14px;
  }
  .finding.CRITICAL { border-left-color: #c0182e; }
  .finding.HIGH     { border-left-color: #d63a2e; }
  .finding.MEDIUM   { border-left-color: #e0921a; }
  .finding.LOW      { border-left-color: #3a6fd8; }
  .finding.INFO     { border-left-color: #8e9aad; }
  .finding .head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid transparent;
  }
  .badge.CRITICAL { background: var(--crit-bg); color: var(--crit-fg); border-color: var(--crit-bd); }
  .badge.HIGH     { background: var(--high-bg); color: var(--high-fg); border-color: var(--high-bd); }
  .badge.MEDIUM   { background: var(--med-bg);  color: var(--med-fg);  border-color: var(--med-bd); }
  .badge.LOW      { background: var(--low-bg);  color: var(--low-fg);  border-color: var(--low-bd); }
  .badge.INFO     { background: var(--info-bg); color: var(--info-fg); border-color: var(--info-bd); }
  .finding .rule { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; font-weight: 600; }
  .finding .oid { color: #5b6b85; font-size: 12px; font-weight: 500; }
  .finding .loc {
    margin: 8px 0 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    color: #5b6b85;
  }
  .finding .msg { margin: 8px 0 0; }
  .finding pre {
    margin: 12px 0 0;
    background: #0f1729;
    color: #e4ebf5;
    border-radius: 6px;
    padding: 12px 14px;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.45;
  }
  .finding pre .ln { color: #5b6b85; user-select: none; margin-right: 14px; }
  .finding .doc { margin: 10px 0 0; font-size: 13px; }
  .finding .doc a { color: #2f6feb; text-decoration: none; }
  .finding .doc a:hover { text-decoration: underline; }
  .empty {
    margin-top: 40px;
    text-align: center;
    background: #fff;
    border: 1px solid #e2e7f0;
    border-radius: 10px;
    padding: 48px 24px;
  }
  .empty .check { font-size: 40px; color: #1f9d55; }
  .empty h2 { margin: 12px 0 4px; font-size: 20px; }
  .empty p { margin: 0; color: #5b6b85; }
  footer.report { margin-top: 40px; color: #8090a8; font-size: 12px; text-align: center; }
  footer.report a { color: #5b6b85; }
  @media print {
    body { background: #fff; }
    .finding, .empty { break-inside: avoid; }
  }
`;

const SEVERITY_LABEL: Record<SeverityName, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  INFO: 'Info',
};

function renderSummary(counts: Record<SeverityName, number>, total: number): string {
  const pills = SEVERITY_ORDER.filter((s) => counts[s] > 0)
    .map(
      (s) =>
        `<span class="pill ${s}"><span class="n">${counts[s]}</span> ${escapeHtml(SEVERITY_LABEL[s])}</span>`,
    )
    .join('\n        ');
  const totalPill = `<span class="pill total"><span class="n">${total}</span> total</span>`;
  return `<div class="summary">\n        ${totalPill}${pills ? `\n        ${pills}` : ''}\n      </div>`;
}

function renderSnippet(snippet: string | null, startLine: number): string {
  if (snippet === null) return '';
  // A blank flagged line is worth nothing to show; skip it.
  if (snippet.trim() === '') return '';
  return `\n        <pre><span class="ln">${escapeHtml(startLine)}</span>${escapeHtml(snippet)}</pre>`;
}

function renderFinding(f: Finding, snippet: string | null): string {
  const oid = f.oauthlintRuleId
    ? ` <span class="oid">(${escapeHtml(f.oauthlintRuleId)})</span>`
    : '';
  const message = escapeHtml(f.message).replace(/\r?\n/g, '<br>');
  const href = f.docUrl ? safeHref(f.docUrl) : null;
  const doc = href
    ? `\n        <p class="doc">📖 <a href="${escapeHtml(href)}" rel="noreferrer noopener">${escapeHtml(href)}</a></p>`
    : '';
  return `      <article class="finding ${f.severity}">
        <div class="head">
          <span class="badge ${f.severity}">${escapeHtml(f.severity)}</span>
          <span class="rule">${escapeHtml(f.ruleId)}</span>${oid}
        </div>
        <p class="loc">${escapeHtml(f.filePath)}:${escapeHtml(f.startLine)}</p>
        <p class="msg">${message}</p>${renderSnippet(snippet, f.startLine)}${doc}
      </article>`;
}

function renderGroups(findings: Finding[], snippets: Map<Finding, string | null>): string {
  const groups: string[] = [];
  for (const sev of SEVERITY_ORDER) {
    const inGroup = findings.filter((f) => f.severity === sev);
    if (inGroup.length === 0) continue;
    const body = inGroup.map((f) => renderFinding(f, snippets.get(f) ?? null)).join('\n');
    groups.push(
      `    <section class="group">
      <h2>${escapeHtml(SEVERITY_LABEL[sev])} · ${inGroup.length}</h2>
${body}
    </section>`,
    );
  }
  return groups.join('\n');
}

function formatTimestamp(generatedAt: Date | string | undefined): string {
  if (typeof generatedAt === 'string') return generatedAt;
  const d = generatedAt ?? new Date();
  return d.toISOString();
}

/**
 * Build the full HTML report document for a scan result. The only side effect
 * is best-effort disk reads for code snippets (skippable via
 * {@link HtmlReportOptions.readSnippet}). Returns the complete document string.
 */
export async function renderHtmlReport(
  result: ScanResult,
  options: HtmlReportOptions,
): Promise<string> {
  const { findings } = result;
  const counts = severityCounts(findings);
  const total = findings.length;
  const timestamp = formatTimestamp(options.generatedAt);
  const snippets = await resolveSnippets(findings, options.readSnippet);

  const body =
    total === 0
      ? `    <div class="empty">
      <div class="check">✓</div>
      <h2>No issues found</h2>
      <p>OAuthLint scanned the target${result.scannedFiles ? ` (${result.scannedFiles} file${result.scannedFiles === 1 ? '' : 's'})` : ''} and found no auth misconfigurations.</p>
    </div>`
      : `${renderSummary(counts, total)}
${renderGroups(findings, snippets)}`;

  const footerBits = [
    options.version ? `OAuthLint v${escapeHtml(options.version)}` : 'OAuthLint',
    result.semgrepVersion ? `semgrep ${escapeHtml(result.semgrepVersion)}` : null,
    result.scannedFiles ? `${result.scannedFiles} file(s) scanned` : null,
  ].filter((x): x is string => x !== null);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OAuthLint Report</title>
<style>${STYLES}</style>
</head>
<body>
  <header class="report">
    <div class="wrap">
      <h1><span class="mark">OAuth</span>Lint — Security Audit Report</h1>
      <p class="meta">
        Target: <code>${escapeHtml(options.target)}</code><br>
        Generated: <code>${escapeHtml(timestamp)}</code>
      </p>
    </div>
  </header>
  <main class="wrap">
${body}
    <footer class="report">${escapeHtml(footerBits.join(' · '))}</footer>
  </main>
</body>
</html>
`;
}
