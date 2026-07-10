import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  EngineUnavailableError,
  SemgrepNotInstalledError,
  SemgrepOutputError,
  SemgrepResourceError,
} from 'oauthlint';
import { ToolError } from './errors.js';
import { summariseScan } from './findings.js';
import { explainRule, listRules } from './rules.js';
import { scanCode, scanPath } from './scanner.js';
import { explainRuleShape, listRulesShape, scanCodeShape, scanPathShape } from './schemas.js';

const PKG_VERSION = '0.1.0';

/**
 * Turn any thrown value into a clean MCP tool error. Known failures get their
 * own clear message; a scan engine that cannot be resolved (offline on first
 * run with nothing installed) carries an actionable hint the calling agent can
 * relay.
 */
function errorResult(err: unknown): CallToolResult {
  let text: string;
  if (
    err instanceof EngineUnavailableError ||
    err instanceof SemgrepNotInstalledError ||
    err instanceof SemgrepResourceError ||
    err instanceof SemgrepOutputError ||
    err instanceof ToolError
  ) {
    text = err.message;
  } else {
    text = err instanceof Error ? err.message : String(err);
  }
  return { content: [{ type: 'text', text }], isError: true };
}

/** A success result carrying both a human summary and machine-readable data. */
function dataResult(summary: string, data: object): CallToolResult {
  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: data as CallToolResult['structuredContent'],
  };
}

/**
 * Build the OAuthLint MCP server with its four tools registered. The transport
 * is the caller's responsibility (stdio in the bundled binary), which keeps the
 * server unit-testable.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: 'oauthlint', version: PKG_VERSION });

  server.registerTool(
    'scan_code',
    {
      title: 'Scan a code snippet for auth anti-patterns',
      description:
        'Scan an in-memory code snippet for OAuth/OIDC/JWT/session/CORS anti-patterns. ' +
        'Write the code an AI tool just generated here to check it before showing it to ' +
        'the user. The snippet is scanned in a private temp file and never written to the ' +
        "user's project. Self-contained: the scan engine is downloaded and cached on first use.",
      inputSchema: scanCodeShape,
    },
    async (args) => {
      try {
        const result = await scanCode(args);
        return dataResult(summariseScan(result, 'the snippet'), result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'scan_path',
    {
      title: 'Scan files on disk for auth anti-patterns',
      description:
        'Scan a file or directory on disk for OAuth/OIDC/JWT/session/CORS anti-patterns. ' +
        'Self-contained: the scan engine is downloaded and cached on first use.',
      inputSchema: scanPathShape,
    },
    async (args) => {
      try {
        const result = await scanPath(args);
        return dataResult(summariseScan(result, args.path), result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'explain_rule',
    {
      title: 'Explain an OAuthLint rule',
      description:
        'Return the full details of a rule: severity, CWE, OWASP, why it matters and how ' +
        'to fix it, plus vulnerable and safe code examples. Accepts a rule id, slug or ' +
        'oauthlint-rule-id.',
      inputSchema: explainRuleShape,
    },
    async ({ rule }) => {
      try {
        const explained = await explainRule(rule);
        const summary = `${explained.id} (${explained.findingSeverity}): ${explained.message
          .split('\n')[0]
          ?.trim()}`;
        return dataResult(summary, explained);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'list_rules',
    {
      title: 'List OAuthLint rules',
      description:
        'List the rules OAuthLint ships, optionally filtered by language and minimum ' +
        'severity. Returns id, title, severity, languages and CWE for each rule.',
      inputSchema: listRulesShape,
    },
    async (args) => {
      try {
        const rules = await listRules(args);
        const summary = `${rules.length} rule${rules.length === 1 ? '' : 's'} match.`;
        return dataResult(summary, { ruleCount: rules.length, rules });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  return server;
}
