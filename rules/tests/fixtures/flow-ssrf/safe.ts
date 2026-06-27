import type { Request, Response } from 'express';
import axios from 'axios';
import http from 'node:http';

// Constant destination — never tainted, never fires.
export async function health(_req: Request, res: Response): Promise<void> {
  const r = await fetch('https://api.internal/health');
  res.json(await r.json());
}

// Constant base URL with a fixed path.
export async function status(_req: Request, res: Response): Promise<void> {
  const r = await axios.get('https://api.internal/status');
  res.json(r.data);
}

const ALLOWED_HOSTS = new Set(['api.partner.com', 'cdn.partner.com']);

// Host allow-list helper: only returns the URL when its host is trusted.
function isAllowedUrl(url: string): string {
  try {
    return ALLOWED_HOSTS.has(new URL(url).host) ? url : 'https://api.partner.com/';
  } catch {
    return 'https://api.partner.com/';
  }
}

// Raw request input only reaches fetch() after passing the allow-list check.
export async function fetchPartner(req: Request, res: Response): Promise<void> {
  const target = isAllowedUrl(req.query.url as string);
  const r = await fetch(target);
  res.json(await r.json());
}

const ALLOWED_ENDPOINTS = ['https://api.partner.com/v1', 'https://api.partner.com/v2'];

// Validation helper returns a vetted endpoint via an allow-list membership test.
function validateUrl(candidate: string): string {
  return ALLOWED_ENDPOINTS.includes(candidate) ? candidate : ALLOWED_ENDPOINTS[0];
}

export async function callPartner(req: Request, res: Response): Promise<void> {
  const endpoint = validateUrl(req.body.endpoint as string);
  const r = await axios.get(endpoint);
  res.json(r.data);
}

const HOSTS = new Set(['internal.svc']);

// assertAllowedHost-style helper used before the request.
function assertAllowedHost(url: string): string {
  if (!HOSTS.has(new URL(url).host)) {
    throw new Error('host not allowed');
  }
  return url;
}

export function relayInternal(req: Request, res: Response): void {
  const dest = assertAllowedHost(req.params.target);
  http.get(dest, (upstream) => upstream.pipe(res));
}
