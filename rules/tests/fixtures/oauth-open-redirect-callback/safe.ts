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
