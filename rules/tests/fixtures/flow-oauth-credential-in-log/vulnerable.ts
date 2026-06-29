import type { Request, Response } from 'express';

declare const logger: {
  info: (...a: unknown[]) => void;
  debug: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

// Authorization code from the callback logged directly.
export function callback(req: Request, res: Response): void {
  // ruleid: auth.flow.oauth-credential-in-log
  console.log('oauth callback', req.query.code);
  res.sendStatus(200);
}

// access_token assigned to a local, then logged via a logger (indirection).
export function exchange(req: Request, res: Response): void {
  const at = req.body.access_token as string;
  // ruleid: auth.flow.oauth-credential-in-log
  logger.info('token exchange complete', at);
  res.sendStatus(200);
}

// Raw Authorization header logged on an auth failure.
export function authFailure(req: Request, res: Response): void {
  // ruleid: auth.flow.oauth-credential-in-log
  console.error('auth failed for', req.headers.authorization);
  res.sendStatus(401);
}

// refresh_token from the body logged via logger.debug.
export function refresh(req: Request, res: Response): void {
  const rt = req.body.refresh_token as string;
  // ruleid: auth.flow.oauth-credential-in-log
  logger.debug(rt);
  res.sendStatus(200);
}

// id_token via index accessor, interpolated into a warning.
export function verifyId(req: Request, res: Response): void {
  // ruleid: auth.flow.oauth-credential-in-log
  console.warn('received id_token', req.query['id_token']);
  res.sendStatus(200);
}
