import type { Request, Response } from 'express';

// Constant destination — never tainted, never fires.
export function dashboard(_req: Request, res: Response): void {
  res.redirect('/dashboard');
}

// Constant with status code.
export function home(_req: Request, res: Response): void {
  res.redirect(301, '/');
}

const ALLOWED_RETURNS = ['/account', '/billing', '/settings'];

// Allow-list validation helper returns a vetted path; the raw request input
// only reaches the sink after passing through the allow-list check.
function validateRedirect(candidate: string): string {
  return ALLOWED_RETURNS.includes(candidate) ? candidate : '/account';
}

export function safeReturn(req: Request, res: Response): void {
  const dest = validateRedirect(req.query.returnTo as string);
  res.redirect(dest);
}

const ALLOWED_HOSTS = new Set(['app.example.com', 'www.example.com']);

// Host allow-list helper: only returns the URL when its host is trusted.
function isAllowedUrl(url: string): string {
  try {
    return ALLOWED_HOSTS.has(new URL(url).host) ? url : '/';
  } catch {
    return '/';
  }
}

export function validatedRedirect(req: Request, res: Response): void {
  const target = isAllowedUrl(req.body.url as string);
  res.redirect(target);
}

const ROUTES = new Set(['/inbox', '/profile']);

// Set-based allow-list helper.
function sanitizeRedirect(candidate: string): string {
  return ROUTES.has(candidate) ? candidate : '/inbox';
}

export function gatedLocation(req: Request, res: Response): void {
  const to = sanitizeRedirect(req.params.to);
  res.location(to);
}
