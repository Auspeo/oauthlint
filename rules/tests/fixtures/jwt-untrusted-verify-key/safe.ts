import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

const ALLOWED_ALGS = ['RS256'];

// Vet a candidate algorithm against a constant allow-list before use.
function validateAlgorithm(candidate: string): string {
  return ALLOWED_ALGS.includes(candidate) ? candidate : 'RS256';
}

// Constant key and constant algorithms — nothing request-controlled reaches
// the verification parameters. The token itself coming from the request is
// expected and must not fire.
export function verify(req: Request, res: Response): void {
  const token = (req.headers.authorization as string).slice(7);
  const claims = jwt.verify(token, process.env.JWT_SECRET as string, {
    algorithms: ['RS256'],
  });
  res.json(claims);
}

// Sanitized: the requested algorithm is checked against the allow-list helper
// before it is passed to verify(), so the taint is cleared.
export function verifyWithVettedAlg(req: Request, res: Response): void {
  const alg = validateAlgorithm(req.body.alg as string);
  const claims = jwt.verify(req.body.token as string, process.env.JWT_SECRET as string, {
    algorithms: [alg],
  });
  res.json(claims);
}

const KEYS: Record<string, string> = {
  default: process.env.JWT_PUBLIC_KEY as string,
};

// The key is resolved from a trusted key set, never from the request body.
export function verifyWithResolvedKey(req: Request, res: Response): void {
  const key = KEYS.default;
  const claims = jwt.verify(req.body.token as string, key, { algorithms: ['RS256'] });
  res.json(claims);
}
