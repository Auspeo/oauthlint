import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';

// CSPRNG-backed session id: safe.
const t1 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableDnsRebindingProtection: true,
});

// Stateless mode (no session ids): safe.
const t2 = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});
