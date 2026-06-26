#!/usr/bin/env node
/**
 * OAuthLint Action — annotations + job summary.
 *
 * Reads an OAuthLint `scan --json` report and produces:
 *   1. GitHub workflow-command annotations (`::error` / `::warning`) so each
 *      finding shows up inline on the PR's Files-changed tab and in the checks
 *      summary. No token or extra permission is required — these are stdout
 *      workflow commands.
 *   2. A Markdown job summary appended to `$GITHUB_STEP_SUMMARY`.
 *
 * The logic is factored into pure, exported functions so it can be unit-tested
 * without running the Docker image. When invoked directly it reads the JSON
 * report path from argv[2], prints annotations to stdout, and appends the
 * summary to `$GITHUB_STEP_SUMMARY` (when set).
 */
import { appendFileSync, readFileSync } from 'node:fs';

/** Severities at or above HIGH map to `::error`; everything else to `::warning`. */
const ERROR_SEVERITIES = new Set(['HIGH', 'CRITICAL']);

const SEVERITY_ORDER = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Map a finding severity to the GitHub workflow-command kind.
 * HIGH / CRITICAL → "error"; MEDIUM and below → "warning".
 */
export function severityToCommand(severity) {
  return ERROR_SEVERITIES.has(String(severity).toUpperCase()) ? 'error' : 'warning';
}

/**
 * Normalize a finding's file path to be repo-relative so GitHub can anchor it
 * to the diff. Strips a leading workspace prefix and any leading "./" or "/".
 */
export function normalizePath(filePath, workspace) {
  let p = String(filePath ?? '');
  if (workspace) {
    // Ensure we compare against a trailing-slash-terminated workspace so we
    // strip the directory boundary cleanly.
    const ws = workspace.endsWith('/') ? workspace : `${workspace}/`;
    if (p.startsWith(ws)) {
      p = p.slice(ws.length);
    } else if (p === workspace) {
      p = '';
    }
  }
  // Drop any remaining leading "./" or absolute "/".
  p = p.replace(/^\.\//, '').replace(/^\/+/, '');
  return p;
}

/**
 * Escape a string for use as a GitHub workflow-command *message* (the part
 * after `::`). Per the workflow-command spec, %, CR and LF must be encoded.
 */
export function escapeData(value) {
  return String(value ?? '')
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

/**
 * Escape a string for use as a workflow-command *property* value (e.g. the
 * `title=` field). In addition to the data escapes, `,` and `:` must be
 * encoded so they don't terminate the property list.
 */
export function escapeProperty(value) {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

/**
 * Build a single GitHub workflow-command annotation line for a finding.
 * Returns `null` when the finding has no usable file path.
 */
export function formatAnnotation(finding, workspace) {
  const command = severityToCommand(finding.severity);
  const file = normalizePath(finding.filePath, workspace);
  if (!file) return null;

  const props = [`file=${escapeProperty(file)}`];
  const line = Number(finding.startLine);
  if (Number.isFinite(line) && line > 0) {
    props.push(`line=${escapeProperty(line)}`);
  }
  // The CLI JSON has no column today; only emit `col` when present.
  const col = Number(finding.startColumn ?? finding.col);
  if (Number.isFinite(col) && col > 0) {
    props.push(`col=${escapeProperty(col)}`);
  }
  const title = finding.oauthlintRuleId || finding.ruleId;
  if (title) {
    props.push(`title=${escapeProperty(title)}`);
  }

  // Keep the message single-line: the data-escape encodes any embedded newline.
  const message = escapeData(finding.message || finding.ruleId || 'OAuthLint finding');
  return `::${command} ${props.join(',')}::${message}`;
}

/** Build every annotation line for a list of findings (skips path-less ones). */
export function formatAnnotations(findings, workspace) {
  return findings.map((f) => formatAnnotation(f, workspace)).filter((line) => line !== null);
}

/** Derive a rule doc URL from a finding, preferring the CLI-provided docUrl. */
export function ruleDocUrl(finding) {
  if (finding.docUrl) return finding.docUrl;
  // Fall back to deriving a slug from the dotted ruleId, e.g.
  // "auth.jwt.alg-none" → "oauthlint.dev/rules/jwt-alg-none".
  const id = finding.ruleId;
  if (!id) return null;
  const parts = String(id).split('.');
  const slug = parts[parts.length - 1];
  if (!slug) return null;
  return `https://oauthlint.dev/rules/${slug}`;
}

/** Escape a value for safe inclusion inside a Markdown table cell. */
export function escapeMarkdownCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

/** Maximum number of rows we render in the summary table before collapsing. */
export const SUMMARY_ROW_CAP = 50;

/**
 * Build the Markdown job summary: a heading, a count-by-severity line, and a
 * findings table (capped, with a "+N more" note when there are more rows than
 * the cap — never silently truncated).
 */
export function buildSummary(findings, workspace, cap = SUMMARY_ROW_CAP) {
  const lines = ['## OAuthLint results', ''];

  if (!findings || findings.length === 0) {
    lines.push('No OAuth/OIDC/JWT findings. ✅', '');
    return lines.join('\n');
  }

  // Count by severity, highest first.
  const counts = new Map();
  for (const f of findings) {
    const sev = String(f.severity).toUpperCase();
    counts.set(sev, (counts.get(sev) ?? 0) + 1);
  }
  const ordered = [...SEVERITY_ORDER].reverse().filter((s) => counts.has(s));
  const countSummary = ordered.map((s) => `**${counts.get(s)}** ${s}`).join(' · ');
  const total = findings.length;
  lines.push(`Found **${total}** finding${total === 1 ? '' : 's'}: ${countSummary}`, '');

  lines.push('| Severity | Rule | Location | Message |');
  lines.push('| --- | --- | --- | --- |');

  const shown = findings.slice(0, cap);
  for (const f of shown) {
    const sev = escapeMarkdownCell(String(f.severity).toUpperCase());
    const ruleLabel = f.oauthlintRuleId || f.ruleId || '';
    const docUrl = ruleDocUrl(f);
    const rule = docUrl
      ? `[${escapeMarkdownCell(ruleLabel)}](${docUrl})`
      : escapeMarkdownCell(ruleLabel);
    const file = normalizePath(f.filePath, workspace);
    const locText = file && f.startLine ? `${file}:${f.startLine}` : file;
    const loc = file ? `\`${escapeMarkdownCell(locText)}\`` : '—';
    const message = escapeMarkdownCell(f.message || '');
    lines.push(`| ${sev} | ${rule} | ${loc} | ${message} |`);
  }

  if (findings.length > cap) {
    const more = findings.length - cap;
    lines.push(
      '',
      `_…and **${more}** more finding${more === 1 ? '' : 's'} not shown in this table._`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

/** Safely read + parse the JSON report, returning the findings array. */
export function readFindings(reportPath) {
  let raw;
  try {
    raw = readFileSync(reportPath, 'utf8');
  } catch {
    return null; // JSON missing — caller decides how to handle.
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null; // Malformed JSON — treat as "no usable report".
  }
  if (!parsed || !Array.isArray(parsed.findings)) return [];
  return parsed.findings;
}

/** Append text to $GITHUB_STEP_SUMMARY when set; no-op otherwise. */
function appendSummary(text) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    appendFileSync(summaryPath, `${text}\n`);
  } catch (err) {
    console.error(`annotate.mjs: could not write step summary: ${err.message}`);
  }
}

/** CLI entrypoint: node annotate.mjs <report.json> */
function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error('annotate.mjs: missing report path argument');
    process.exit(0); // never fail the job over annotation tooling
  }
  const workspace = process.env.GITHUB_WORKSPACE || '';
  const findings = readFindings(reportPath);

  if (findings === null) {
    // Missing or unparseable report: emit nothing inline, but leave a note in
    // the summary so the absence is visible rather than silent.
    const note = '## OAuthLint results\n\nNo JSON report was available to build annotations.\n';
    appendSummary(note);
    return;
  }

  for (const line of formatAnnotations(findings, workspace)) {
    process.stdout.write(`${line}\n`);
  }

  appendSummary(buildSummary(findings, workspace));
}

// Run main only when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
