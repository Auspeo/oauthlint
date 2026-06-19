interface Req {
  query: { next?: string };
}
interface Res {
  redirect: (url: string) => void;
}

const ALLOWED_REDIRECTS = new Set(['/dashboard', '/profile', '/']);

// ok: auth.oauth.open-redirect-callback
export function goodCallback(req: Req, res: Res) {
  const next = req.query.next ?? '/dashboard';
  if (!ALLOWED_REDIRECTS.has(next)) {
    res.redirect('/dashboard');
    return;
  }
  res.redirect(next);
}
