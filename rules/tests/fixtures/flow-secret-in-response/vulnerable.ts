import type { Request, Response } from 'express';

// Inline: API key read from env and returned in a JSON body.
export function getConfig(_req: Request, res: Response): void {
  // ruleid: auth.flow.secret-in-response
  res.json({ apiKey: process.env.API_KEY });
}

// Intra-procedural dataflow: assign the secret to a local, then res.send() it.
export function leakPassword(_req: Request, res: Response): void {
  const s = process.env.DB_PASSWORD;
  // ruleid: auth.flow.secret-in-response
  res.send(s);
}

// OAuth client secret returned in JSON.
export function getClient(_req: Request, res: Response): void {
  // ruleid: auth.flow.secret-in-response
  res.json({ secret: process.env.CLIENT_SECRET });
}

// Token flows through a local into res.end().
export function dumpToken(_req: Request, res: Response): void {
  const t = process.env.ACCESS_TOKEN;
  // ruleid: auth.flow.secret-in-response
  res.end(t);
}

// Index-access form of process.env into res.jsonp().
export function getKey(_req: Request, res: Response): void {
  // ruleid: auth.flow.secret-in-response
  res.jsonp({ key: process.env['STRIPE_API_KEY'] });
}

// Private key streamed back via res.write().
export function writeCredential(_req: Request, res: Response): void {
  const pk = process.env.PRIVATE_KEY;
  // ruleid: auth.flow.secret-in-response
  res.write(pk);
  res.end();
}
