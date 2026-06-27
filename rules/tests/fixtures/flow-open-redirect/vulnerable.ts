import type { Request, Response } from 'express';

// Direct: ?next= straight into res.redirect.
export function loginCallback(req: Request, res: Response): void {
  // ruleid: auth.flow.open-redirect
  res.redirect(req.query.next as string);
}

// Direct with a status code argument.
export function returnTo(req: Request, res: Response): void {
  // ruleid: auth.flow.open-redirect
  res.redirect(302, req.query.returnTo as string);
}

// Intra-procedural dataflow: assign to a local, then redirect.
export function afterPasswordReset(req: Request, res: Response): void {
  const dest = req.body.url as string;
  // ruleid: auth.flow.open-redirect
  res.redirect(dest);
}

// Route param flows into res.location().
export function gotoTenant(req: Request, res: Response): void {
  // ruleid: auth.flow.open-redirect
  res.location(req.params.target);
}

// Header set explicitly to a request-controlled value.
export function legacyRedirect(req: Request, res: Response): void {
  // ruleid: auth.flow.open-redirect
  res.set('Location', req.query.url as string);
}

// setHeader form.
export function rawRedirect(req: Request, res: Response): void {
  // ruleid: auth.flow.open-redirect
  res.setHeader('Location', req.cookies.last_page);
}

// writeHead with a Location header built from a request header.
export function proxyHop(req: Request, res: Response): void {
  // ruleid: auth.flow.open-redirect
  res.writeHead(302, { 'Content-Type': 'text/plain', Location: req.headers.referer as string });
  res.end();
}
