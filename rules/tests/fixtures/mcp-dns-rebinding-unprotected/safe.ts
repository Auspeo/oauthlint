import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';

const t1 = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableDnsRebindingProtection: true,
  allowedHosts: ['127.0.0.1:3000'],
  allowedOrigins: ['https://app.example.com'],
});
