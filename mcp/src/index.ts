import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

export { createServer } from './server.js';
export type { ScanToolResult, ToolFinding } from './findings.js';
export type { RuleCatalogueEntry } from './rules.js';

/**
 * Start the OAuthLint MCP server on the stdio transport — the standard wiring
 * for a local server launched by Claude Desktop, Cursor or Windsurf. Diagnostics
 * go to stderr so they never corrupt the JSON-RPC stream on stdout.
 */
export async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('oauthlint-mcp server running on stdio\n');
}
