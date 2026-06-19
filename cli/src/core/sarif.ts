import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Finding, ScanResult, SeverityName } from '../types.js';

/**
 * Convert OAuthLint scan results into SARIF v2.1.0.
 *
 * Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html
 *
 * GitHub Code Scanning consumes SARIF directly via the
 * `github/codeql-action/upload-sarif` action, which is the integration
 * path most enterprise teams want.
 */

interface SarifReport {
  $schema: string;
  version: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: { driver: SarifDriver };
  results: SarifResult[];
}

interface SarifDriver {
  name: string;
  version: string;
  informationUri: string;
  rules: SarifRule[];
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  helpUri?: string;
  defaultConfiguration: { level: 'note' | 'warning' | 'error' };
  properties: { tags: string[]; precision?: string; security_severity?: string };
}

interface SarifResult {
  ruleId: string;
  level: 'note' | 'warning' | 'error';
  message: { text: string };
  locations: SarifLocation[];
  properties?: Record<string, unknown>;
}

interface SarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string };
    region: { startLine: number; endLine: number };
  };
}

const SARIF_LEVEL: Record<SeverityName, 'note' | 'warning' | 'error'> = {
  INFO: 'note',
  LOW: 'note',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

// GitHub uses a 0.0–10.0 numeric "security severity" to colour the
// inline annotations in the Security tab.
const SECURITY_SEVERITY: Record<SeverityName, string> = {
  INFO: '1.0',
  LOW: '3.0',
  MEDIUM: '5.5',
  HIGH: '7.5',
  CRITICAL: '9.5',
};

async function readToolVersion(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    resolve(here, '..', '..', 'package.json'),
    resolve(here, '..', '..', '..', 'package.json'),
  ]) {
    try {
      const pkg = JSON.parse(await readFile(candidate, 'utf8')) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      /* try next */
    }
  }
  return '0.0.0';
}

export async function toSarif(result: ScanResult): Promise<SarifReport> {
  const version = await readToolVersion();
  const ruleIndex = new Map<string, SarifRule>();
  for (const f of result.findings) {
    if (ruleIndex.has(f.ruleId)) continue;
    ruleIndex.set(f.ruleId, buildRule(f));
  }

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'OAuthLint',
            version,
            informationUri: 'https://oauthlint.dev',
            rules: [...ruleIndex.values()],
          },
        },
        results: result.findings.map((f) => buildResult(f)),
      },
    ],
  };
}

function buildRule(f: Finding): SarifRule {
  const tags = ['security', 'oauthlint'];
  if (f.cwe) tags.push(`external/cwe/${f.cwe.toLowerCase()}`);
  if (f.llmPrevalence) tags.push(`llm-prevalence/${f.llmPrevalence.toLowerCase()}`);

  return {
    id: f.ruleId,
    name: f.ruleId,
    shortDescription: { text: f.message.split('\n')[0]?.trim() ?? f.ruleId },
    fullDescription: { text: f.message.trim() },
    helpUri: f.docUrl,
    defaultConfiguration: { level: SARIF_LEVEL[f.severity] },
    properties: {
      tags,
      precision: 'medium',
      security_severity: SECURITY_SEVERITY[f.severity],
    },
  };
}

function buildResult(f: Finding): SarifResult {
  return {
    ruleId: f.ruleId,
    level: SARIF_LEVEL[f.severity],
    message: { text: f.message.split('\n')[0]?.trim() ?? f.ruleId },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: relativise(f.filePath) },
          region: { startLine: f.startLine, endLine: f.endLine },
        },
      },
    ],
    properties: {
      oauthlintRuleId: f.oauthlintRuleId,
      severity: f.severity,
      llmPrevalence: f.llmPrevalence,
    },
  };
}

function relativise(filePath: string): string {
  // GitHub Code Scanning wants paths relative to the repo root. Strip
  // the cwd if present; otherwise leave the path alone (caller responsibility).
  const cwd = process.cwd();
  if (filePath.startsWith(`${cwd}/`)) {
    return filePath.slice(cwd.length + 1);
  }
  if (filePath.startsWith(cwd)) {
    return filePath.slice(cwd.length).replace(/^\/+/, '');
  }
  return filePath;
}
