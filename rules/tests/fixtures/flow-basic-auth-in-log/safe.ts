import type { Request, Response } from 'express';
import auth from 'basic-auth';

declare const logger: {
  info: (...a: unknown[]) => void;
  debug: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

declare function redact(v: unknown): string;

// Safe: log only the non-sensitive username, never the password.
export function login(req: Request, res: Response): void {
  const credentials = auth(req);
  // ok: auth.flow.basic-auth-in-log
  console.log('login attempt for user', credentials?.name);
  res.sendStatus(200);
}

// Safe: the password is redacted before it reaches the log sink.
export function verify(req: Request, res: Response): void {
  const pw = auth(req)?.pass;
  // ok: auth.flow.basic-auth-in-log
  logger.debug('verifying', redact(pw));
  res.sendStatus(200);
}

// Safe: the Proxy-Authorization header is masked (first chars only) before
// logging, so the live credential never reaches the log.
export function proxyAuth(req: Request, res: Response): void {
  const header = req.get('proxy-authorization') ?? '';
  // ok: auth.flow.basic-auth-in-log
  console.error('proxy auth header prefix', header.slice(0, 6));
  res.sendStatus(407);
}

// Safe: a constant status message — no credential involved.
export function status(_req: Request, res: Response): void {
  // ok: auth.flow.basic-auth-in-log
  logger.info('proxy authentication required');
  res.sendStatus(407);
}
