import pc from 'picocolors';

/**
 * `oauthlint probe <url>` — a live, credential-free MCP OAuth 2.1 resource-server
 * conformance probe. Static rules catch the code; this catches the deployed
 * behaviour of a running server. It never needs a token: every check is a
 * negative test (unauthenticated / invalid-token requests) plus RFC 9728
 * metadata discovery. Nothing is written; the server is only sent requests it
 * must already handle.
 */
export interface ProbeOptions {
  stream?: NodeJS.WritableStream;
  json?: boolean;
  /** Per-request timeout in ms (default 8000). */
  timeoutMs?: number;
  /** Injectable fetch for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

type Status = 'ok' | 'warn' | 'fail' | 'skip';

interface Check {
  name: string;
  status: Status;
  details: string;
}

const PROBE_TOKEN = 'oauthlint-probe-invalid-token';

function badge(s: Status): string {
  switch (s) {
    case 'ok':
      return pc.green(' ✓ ');
    case 'warn':
      return pc.yellow(' ! ');
    case 'fail':
      return pc.red(' ✗ ');
    case 'skip':
      return pc.dim(' – ');
  }
}

async function timedFetch(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: ac.signal, redirect: 'manual' });
  } finally {
    clearTimeout(t);
  }
}

/** RFC 9728 §3.1: insert `/.well-known/oauth-protected-resource` after the host. */
function metadataUrls(target: URL): string[] {
  const base = `${target.origin}/.well-known/oauth-protected-resource`;
  const path = target.pathname.replace(/\/+$/, '');
  const urls = [base];
  if (path && path !== '/') urls.unshift(`${base}${path}`);
  return urls;
}

export async function runProbe(rawUrl: string, opts: ProbeOptions = {}): Promise<number> {
  const out = opts.stream ?? process.stdout;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const checks: Check[] = [];

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    out.write(pc.red(`Invalid URL: ${rawUrl}\n`));
    return 2;
  }

  // 1. Unauthenticated request — the server MUST require a token (spec: 401).
  let unauth: Response | undefined;
  try {
    unauth = await timedFetch(fetchImpl, target.href, { method: 'GET' }, timeoutMs);
  } catch (e) {
    out.write(pc.red(`Could not reach ${target.href}: ${(e as Error).message}\n`));
    return 2;
  }
  if (unauth.status === 401 || unauth.status === 403) {
    checks.push({
      name: 'Requires authentication',
      status: 'ok',
      details: `${unauth.status} without a token`,
    });
  } else if (unauth.status === 200) {
    checks.push({
      name: 'Requires authentication',
      status: 'fail',
      details: '200 with no token — endpoint is unauthenticated',
    });
  } else if (unauth.status === 405 || unauth.status === 404) {
    checks.push({
      name: 'Requires authentication',
      status: 'skip',
      details: `${unauth.status} on GET — try the exact MCP path/method`,
    });
  } else {
    checks.push({
      name: 'Requires authentication',
      status: 'warn',
      details: `unexpected ${unauth.status}`,
    });
  }

  // 2. WWW-Authenticate advertises resource_metadata (RFC 9728).
  const wwwAuth = unauth.headers.get('www-authenticate') ?? '';
  if (/bearer/i.test(wwwAuth) && /resource_metadata=/i.test(wwwAuth)) {
    checks.push({
      name: 'WWW-Authenticate',
      status: 'ok',
      details: 'Bearer challenge advertises resource_metadata',
    });
  } else if (/bearer/i.test(wwwAuth)) {
    checks.push({
      name: 'WWW-Authenticate',
      status: 'warn',
      details: 'Bearer challenge, but no resource_metadata (RFC 9728)',
    });
  } else if (unauth.status === 401 || unauth.status === 403) {
    checks.push({
      name: 'WWW-Authenticate',
      status: 'warn',
      details: 'no Bearer challenge header on the 401',
    });
  } else {
    checks.push({ name: 'WWW-Authenticate', status: 'skip', details: 'not applicable' });
  }

  // 3. Protected Resource Metadata (RFC 9728) is discoverable and well-formed.
  let prmOk = false;
  for (const murl of metadataUrls(target)) {
    try {
      const r = await timedFetch(fetchImpl, murl, { method: 'GET' }, timeoutMs);
      if (r.status !== 200) continue;
      const body = (await r.json()) as { resource?: unknown; authorization_servers?: unknown };
      const hasResource = typeof body.resource === 'string';
      const hasAs =
        Array.isArray(body.authorization_servers) && body.authorization_servers.length > 0;
      if (hasResource && hasAs) {
        checks.push({
          name: 'Protected Resource Metadata',
          status: 'ok',
          details: `RFC 9728 metadata at ${murl}`,
        });
        prmOk = true;
        break;
      }
      checks.push({
        name: 'Protected Resource Metadata',
        status: 'warn',
        details: `metadata present but missing resource / authorization_servers (${murl})`,
      });
      prmOk = true;
      break;
    } catch {
      // try next candidate
    }
  }
  if (!prmOk) {
    checks.push({
      name: 'Protected Resource Metadata',
      status: 'fail',
      details:
        'no /.well-known/oauth-protected-resource (RFC 9728) — clients cannot discover the AS',
    });
  }

  // 4. Invalid token is rejected (the server actually verifies).
  try {
    const bad = await timedFetch(
      fetchImpl,
      target.href,
      { method: 'GET', headers: { Authorization: `Bearer ${PROBE_TOKEN}` } },
      timeoutMs,
    );
    if (bad.status === 401 || bad.status === 403) {
      checks.push({
        name: 'Rejects invalid token',
        status: 'ok',
        details: `${bad.status} for a bogus bearer token`,
      });
    } else if (bad.status === 200) {
      checks.push({
        name: 'Rejects invalid token',
        status: 'fail',
        details: '200 for a bogus token — the server does not verify',
      });
    } else {
      checks.push({
        name: 'Rejects invalid token',
        status: 'warn',
        details: `unexpected ${bad.status}`,
      });
    }
  } catch (e) {
    checks.push({
      name: 'Rejects invalid token',
      status: 'warn',
      details: `request failed: ${(e as Error).message}`,
    });
  }

  if (opts.json) {
    out.write(`${JSON.stringify({ url: target.href, checks }, null, 2)}\n`);
  } else {
    out.write(pc.bold(`OAuthLint — MCP auth probe: ${target.href}\n`));
    out.write(`${pc.dim('─'.repeat(64))}\n`);
    for (const c of checks) {
      out.write(`${badge(c.status)} ${c.name.padEnd(30, ' ')} ${pc.dim(c.details)}\n`);
    }
    out.write(`${pc.dim('─'.repeat(64))}\n`);
    out.write(pc.dim('Credential-free negative tests + RFC 9728 discovery. A full audience\n'));
    out.write(
      pc.dim('check (RFC 8707) needs a token from the AS; run the static mcp/ rules for that.\n'),
    );
  }

  // Exit non-zero if any hard failure (unauthenticated / accepts invalid token / no PRM).
  return checks.some((c) => c.status === 'fail') ? 1 : 0;
}
