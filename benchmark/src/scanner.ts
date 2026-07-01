import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Finding, SemgrepAdapter } from 'oauthlint';
import { RULES_ROOT } from 'oauthlint-rules';
import type { PromptLanguage } from './prompts.js';

/** Abort a scan subprocess after this long so a pathological input can't hang. */
const SCAN_TIMEOUT_MS = 30_000;
/** Cap bytes buffered from Semgrep's stdio. */
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;

/**
 * File extension Semgrep needs to select the right parser for each prompt
 * language. Mirrors the mapping in the MCP package's `languages.ts`.
 */
const EXTENSION: Record<PromptLanguage, string> = {
  ts: 'ts',
  js: 'js',
  python: 'py',
};

/**
 * Scan a snippet of generated code with the OAuthLint rule pack. The code is
 * written to a unique private temp file (mode 0600 inside a 0700 directory)
 * with the language's extension, scanned, and the temp tree is always removed
 * afterwards, even on error. The generated code never touches the working tree.
 */
export async function scanGenerated(code: string, language: PromptLanguage): Promise<Finding[]> {
  const dir = await mkdtemp(join(tmpdir(), 'oauthlint-benchmark-'));
  try {
    const file = join(dir, `generated.${EXTENSION[language]}`);
    await writeFile(file, code, { encoding: 'utf8', mode: 0o600 });
    const adapter = new SemgrepAdapter({
      configPath: RULES_ROOT,
      timeoutMs: SCAN_TIMEOUT_MS,
      maxOutputBytes: MAX_OUTPUT_BYTES,
    });
    const { findings } = await adapter.scan([file]);
    return findings;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
