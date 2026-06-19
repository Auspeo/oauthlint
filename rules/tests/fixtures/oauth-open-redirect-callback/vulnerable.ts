interface Req {
  query: { redirect_to?: string; next?: string };
  body: { return_url?: string };
}
interface Res {
  redirect: (url: string) => void;
}

export function badCallback(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback
  res.redirect(req.query.redirect_to as string);
}

export function badCallback2(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback
  res.redirect(req.body.return_url as string);
}

export function badCallback3(req: Req, res: Res) {
  const key = 'next';
  // ruleid: auth.oauth.open-redirect-callback
  res.redirect(req.query[key] as string);
}
