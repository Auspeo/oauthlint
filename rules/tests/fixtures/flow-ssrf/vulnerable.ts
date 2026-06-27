import type { Request, Response } from 'express';
import axios from 'axios';
import http from 'node:http';
import https from 'node:https';
import got from 'got';

// Direct: ?url= straight into fetch().
export async function proxy(req: Request, res: Response): Promise<void> {
  // ruleid: auth.flow.ssrf
  const r = await fetch(req.query.url as string);
  res.json(await r.json());
}

// Request body field flows into axios.get().
export async function fetchAvatar(req: Request, res: Response): Promise<void> {
  // ruleid: auth.flow.ssrf
  const r = await axios.get(req.body.target as string);
  res.json(r.data);
}

// POST destination from the body.
export async function webhook(req: Request, res: Response): Promise<void> {
  // ruleid: auth.flow.ssrf
  await axios.post(req.body.callback as string, { ok: true });
  res.sendStatus(200);
}

// axios.request({ url: ... }) config form.
export async function relay(req: Request, res: Response): Promise<void> {
  // ruleid: auth.flow.ssrf
  const r = await axios.request({ method: 'GET', url: req.query.endpoint as string });
  res.json(r.data);
}

// Intra-procedural dataflow: assign to a local, then http.get().
export function fetchLegacy(req: Request, res: Response): void {
  const u = req.query.endpoint as string;
  // ruleid: auth.flow.ssrf
  http.get(u, (upstream) => upstream.pipe(res));
}

// https.request with a request-controlled URL.
export function fetchSecure(req: Request, res: Response): void {
  // ruleid: auth.flow.ssrf
  const upstream = https.request(req.params.target, (r) => r.pipe(res));
  upstream.end();
}

// Route param flows into got().
export async function mirror(req: Request, res: Response): Promise<void> {
  // ruleid: auth.flow.ssrf
  const r = await got(req.params.dest);
  res.send(r.body);
}

// Header value flows into a request via https.get().
export function fromHeader(req: Request, res: Response): void {
  // ruleid: auth.flow.ssrf
  https.get(req.headers['x-upstream'] as string, (r) => r.pipe(res));
}
