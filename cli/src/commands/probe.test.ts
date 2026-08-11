import { describe, expect, it } from 'vitest';
import { runProbe } from './probe.js';

/** Collect everything written so we can assert on the report. */
function sink(): { stream: NodeJS.WritableStream; text: () => string } {
  let buf = '';
  const stream = {
    write: (s: string) => {
      buf += s;
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  return { stream, text: () => buf };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('runProbe', () => {
  it('passes a spec-compliant MCP resource server (401 + RFC 9728 metadata + rejects garbage)', async () => {
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (u.includes('/.well-known/oauth-protected-resource')) {
        return json(200, {
          resource: 'https://mcp.example.com/mcp',
          authorization_servers: ['https://as.example.com'],
        });
      }
      // both the no-token and bad-token requests are rejected
      return new Response('', {
        status: 401,
        headers: auth
          ? {}
          : {
              'www-authenticate':
                'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp"',
            },
      });
    }) as unknown as typeof fetch;

    const s = sink();
    const code = await runProbe('https://mcp.example.com/mcp', { fetchImpl, stream: s.stream });
    expect(code).toBe(0);
    expect(s.text()).toContain('Requires authentication');
    expect(s.text()).not.toContain('✗');
  });

  it('fails an unauthenticated server that returns 200 to anyone', async () => {
    const fetchImpl = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/.well-known/oauth-protected-resource'))
        return new Response('', { status: 404 });
      return new Response('ok', { status: 200 });
    }) as unknown as typeof fetch;

    const s = sink();
    const code = await runProbe('https://open.example.com/mcp', { fetchImpl, stream: s.stream });
    expect(code).toBe(1);
    expect(s.text()).toContain('unauthenticated');
  });
});
