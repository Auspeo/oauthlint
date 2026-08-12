import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';

// ruleid: auth.mcp.dns-rebinding-unprotected
const t1 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

// ruleid: auth.mcp.dns-rebinding-unprotected
const t2 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableDnsRebindingProtection: false,
  allowedHosts: ['127.0.0.1:3000'],
});
