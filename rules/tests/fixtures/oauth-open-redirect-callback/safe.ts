interface Req {
  query: { next?: string };
}
interface Res {
  redirect: (url: string) => void;
}

// ok: auth.oauth.open-redirect-callback -- map the input to a controlled constant
const DESTINATIONS: Record<string, string> = {
  profile: '/profile',
  settings: '/settings',
};
export function goodCallback(req: Req, res: Res) {
  switch (req.query.next) {
    case 'profile':
      res.redirect(DESTINATIONS.profile);
      return;
    case 'settings':
      res.redirect(DESTINATIONS.settings);
      return;
    default:
      res.redirect('/dashboard');
  }
}

// ok: auth.oauth.open-redirect-callback -- always redirects to a fixed destination
export function goodCallback2(_req: Req, res: Res) {
  res.redirect('/dashboard');
}

const ALLOWED = new Set(['/profile', '/settings']);

// ok: auth.oauth.open-redirect-callback -- inline allow-list guard validates the
// value before it reaches res.redirect.
export function guardedCallback(req: Req, res: Res) {
  if (ALLOWED.has(req.query.next as string)) {
    res.redirect(req.query.next as string);
  }
}

const ALLOWED_ARR = ['/profile', '/settings'];

// ok: auth.oauth.open-redirect-callback -- Array.includes guard.
export function guardedCallbackIncludes(req: Req, res: Res) {
  if (ALLOWED_ARR.includes(req.query.next as string)) {
    res.redirect(req.query.next as string);
  }
}
