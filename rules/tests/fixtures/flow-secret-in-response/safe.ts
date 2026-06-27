import type { Request, Response } from 'express';

declare function redact(value: string | undefined): string;

// Client-public var (NEXT_PUBLIC_*): exposed to the browser by design, no leak.
export function getPublicConfig(_req: Request, res: Response): void {
  res.json({ url: process.env.NEXT_PUBLIC_API_URL });
}

// Non-secret operational var: the name does not look like a credential.
export function getPort(_req: Request, res: Response): void {
  res.json({ port: process.env.PORT });
}

// A plain constant — never a secret source, never tainted.
export function getVersion(_req: Request, res: Response): void {
  const version = '1.0.0';
  res.send(version);
}

// Secret routed through a redaction helper before the response: taint cleared.
export function getMaskedKey(_req: Request, res: Response): void {
  res.json({ apiKey: redact(process.env.API_KEY) });
}

// Vite client-public var whose name DOES contain a credential keyword
// (api_key) but carries the VITE_ prefix — exposed by design, excluded by the
// source regex's negative lookahead, so no finding.
export function getViteConfig(_req: Request, res: Response): void {
  res.json({ key: process.env.VITE_API_KEY });
}
