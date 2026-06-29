import type { Request, Response } from 'express';
import auth from 'basic-auth';

declare const logger: {
  info: (...a: unknown[]) => void;
  debug: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

// basic-auth parse result logged directly — leaks the decoded password.
export function login(req: Request, res: Response): void {
  const credentials = auth(req);
  // ruleid: auth.flow.basic-auth-in-log
  console.log('login attempt', credentials?.name, credentials?.pass);
  res.sendStatus(200);
}

// basic-auth .pass assigned to a local, then logged via a logger (indirection).
export function verify(req: Request, res: Response): void {
  const pw = auth(req)?.pass;
  // ruleid: auth.flow.basic-auth-in-log
  logger.debug('verifying', pw);
  res.sendStatus(200);
}

// Proxy-Authorization header logged on a proxy auth failure.
export function proxyAuth(req: Request, res: Response): void {
  // ruleid: auth.flow.basic-auth-in-log
  console.error('proxy auth failed for', req.headers['proxy-authorization']);
  res.sendStatus(407);
}

// Proxy-Authorization via req.get(...), interpolated into a warning logger.
export function proxyGet(req: Request, res: Response): void {
  const header = req.get('proxy-authorization');
  // ruleid: auth.flow.basic-auth-in-log
  logger.info(`upstream proxy creds: ${header}`);
  res.sendStatus(200);
}
