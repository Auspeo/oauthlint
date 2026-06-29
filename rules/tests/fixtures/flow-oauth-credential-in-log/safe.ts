import type { Request, Response } from 'express';

declare const logger: {
  info: (...a: unknown[]) => void;
  debug: (...a: unknown[]) => void;
};

declare function redact(value: string): string;

// Constant status message — no request data, no taint.
export function ping(_req: Request, res: Response): void {
  console.log('oauth callback received');
  res.sendStatus(200);
}

// Benign request field (pagination) — not a credential source.
export function list(req: Request, res: Response): void {
  console.log('listing page', req.query.page);
  res.sendStatus(200);
}

// Non-credential identifier — safe to log.
export function whoami(req: Request, res: Response): void {
  logger.info('request from user', req.query.userId);
  res.sendStatus(200);
}

// Sanitized: only a masked prefix of the code is logged.
export function callback(req: Request, res: Response): void {
  const code = req.query.code as string;
  console.log('code prefix', code.slice(0, 6));
  res.sendStatus(200);
}

// Sanitized: the Authorization header is redacted before logging.
export function authFailure(req: Request, res: Response): void {
  logger.debug('auth failed for', redact(req.headers.authorization as string));
  res.sendStatus(401);
}
