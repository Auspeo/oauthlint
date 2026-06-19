interface Req {
  query: { redirect_to?: string; next?: string; url?: string };
  body: { return_url?: string };
}
interface Res {
  redirect: ((url: string) => void) & ((code: number, url: string) => void);
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

export function badCallbackIndirect(req: Req, res: Res) {
  const next = req.query.next as string;
  // ruleid: auth.oauth.open-redirect-callback -- variable indirection
  res.redirect(next);
}

export function badCallbackDefault(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback -- logical-or default
  res.redirect((req.query.next as string) || '/');
}

export function badCallbackStatus(req: Req, res: Res) {
  // ruleid: auth.oauth.open-redirect-callback -- status + url overload
  res.redirect(302, req.query.url as string);
}
