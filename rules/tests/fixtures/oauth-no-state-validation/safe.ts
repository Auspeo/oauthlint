interface Req {
  query: { state?: string };
  session: { oauth_state?: string };
}

// ok: auth.oauth.no-state-validation
export function goodCallback(req: Req) {
  if (req.session.oauth_state !== req.query.state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}
