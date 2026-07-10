import { access, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import {
  type Finding,
  SemgrepAdapter,
  type SeverityName,
  meetsThreshold,
  resolveEngine,
} from 'oauthlint';
import { RULES_ROOT } from 'oauthlint-rules';
import { ToolError } from './errors.js';
import { type ScanToolResult, buildScanResult } from './findings.js';
import { type Language, extensionFor } from './languages.js';

/**
 * Hard limits that keep a single tool call bounded. The MCP server is a
 * long-lived process wired into an editor, so a pathological input must never
 * hang it or exhaust its memory.
 */
/** Abort any scan subprocess after this long. */
const SCAN_TIMEOUT_MS = 30_000;
/** Cap bytes buffered from Semgrep's stdio. */
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
/** Largest snippet `scan_code` will accept (characters). */
export const MAX_CODE_CHARS = 200_000;

/**
 * One adapter factory for every scan, pre-bound to the bundled rule pack and
 * the resource limits above. It resolves the scan engine the same way the CLI
 * does — an installed opengrep/semgrep, or a pinned Opengrep the CLI downloads
 * and checksum-verifies on first use — so the MCP server is self-contained too.
 * `metrics` (i.e. `--metrics=off`) is on only for real Semgrep, which alone
 * accepts the flag. The adapter passes targets after `--` and as discrete argv
 * entries, so no input is ever interpreted as a flag or reaches a shell.
 */
async function adapter(): Promise<SemgrepAdapter> {
  const engine = await resolveEngine();
  return new SemgrepAdapter({
    configPath: RULES_ROOT,
    binary: engine.path,
    metrics: engine.engine === 'semgrep',
    timeoutMs: SCAN_TIMEOUT_MS,
    maxOutputBytes: MAX_OUTPUT_BYTES,
  });
}

function applyMinSeverity(findings: Finding[], minSeverity?: SeverityName): Finding[] {
  if (!minSeverity) return findings;
  return findings.filter((f) => meetsThreshold(f.severity, minSeverity));
}

export interface ScanCodeArgs {
  code: string;
  language: Language;
  minSeverity?: SeverityName;
}

/**
 * Scan an in-memory snippet. The code is written to a unique, private temp file
 * (mode 0600 inside a 0700 directory) with the language's extension, scanned,
 * and the temp tree is always removed afterwards, even on error. The snippet
 * never touches the user's working tree and the temp path is not leaked back
 * to the caller.
 */
export async function scanCode(args: ScanCodeArgs): Promise<ScanToolResult> {
  if (args.code.length > MAX_CODE_CHARS) {
    throw new ToolError(
      `Snippet is ${args.code.length} characters; the limit is ${MAX_CODE_CHARS}. Scan a file or directory with scan_path instead.`,
    );
  }

  const dir = await mkdtemp(join(tmpdir(), 'oauthlint-mcp-'));
  try {
    const file = join(dir, `snippet.${extensionFor(args.language)}`);
    await writeFile(file, args.code, { encoding: 'utf8', mode: 0o600 });
    const engine = await adapter();
    const { findings } = await engine.scan([file]);
    return buildScanResult(applyMinSeverity(findings, args.minSeverity), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export interface ScanPathArgs {
  path: string;
  minSeverity?: SeverityName;
}

/**
 * Scan real files on disk. The path is resolved to an absolute path and checked
 * to exist before scanning; it is handed to Semgrep after `--` so a value that
 * begins with `-` can never be read as a flag.
 */
export async function scanPath(args: ScanPathArgs): Promise<ScanToolResult> {
  const target = args.path.trim();
  if (!target) throw new ToolError('A non-empty path is required.');

  const resolved = isAbsolute(target) ? target : resolve(process.cwd(), target);
  try {
    await access(resolved);
    // Touch stat so a permission/IO error surfaces here as a clean ToolError
    // rather than deep inside the scan.
    await stat(resolved);
  } catch {
    throw new ToolError(`Path does not exist or is not readable: ${resolved}`);
  }

  const engine = await adapter();
  const { findings } = await engine.scan([resolved]);
  return buildScanResult(applyMinSeverity(findings, args.minSeverity), true);
}
