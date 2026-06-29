import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

// Request-controlled verification key (2-argument form): attacker supplies
// both the token and the key it was signed with.
export function verifyWithHeaderKey(req: Request, res: Response): void {
  const token = (req.headers.authorization as string).slice(7);
  // ruleid: auth.jwt.untrusted-verify-key
  const claims = jwt.verify(token, req.headers['x-signing-key'] as string);
  res.json(claims);
}

// Request-controlled key via an intermediate variable (3-argument form).
export function verifyWithBodyKey(req: Request, res: Response): void {
  const key = req.body.publicKey as string;
  // ruleid: auth.jwt.untrusted-verify-key
  const claims = jwt.verify(req.body.token as string, key, { issuer: 'me' });
  res.json(claims);
}

// Request-controlled algorithms allowlist (direct).
export function verifyWithBodyAlgs(req: Request, res: Response): void {
  // ruleid: auth.jwt.untrusted-verify-key
  const claims = jwt.verify(req.body.token as string, process.env.JWT_SECRET as string, {
    algorithms: req.body.algorithms,
  });
  res.json(claims);
}

// Request-controlled algorithm via an intermediate variable.
export function verifyWithHeaderAlg(req: Request, res: Response): void {
  const alg = req.headers['x-alg'] as string;
  // ruleid: auth.jwt.untrusted-verify-key
  const claims = jwt.verify(req.query.token as string, process.env.JWT_SECRET as string, {
    algorithms: [alg],
  });
  res.json(claims);
}
