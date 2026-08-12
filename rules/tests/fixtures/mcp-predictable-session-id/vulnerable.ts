import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// ruleid: auth.mcp.predictable-session-id
const t1 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => Date.now().toString(),
  enableDnsRebindingProtection: true,
});

// ruleid: auth.mcp.predictable-session-id
const t2 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => `sess-${Math.random()}`,
});

let counter = 0;
// ruleid: auth.mcp.predictable-session-id
const t3 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => String(counter++),
});
