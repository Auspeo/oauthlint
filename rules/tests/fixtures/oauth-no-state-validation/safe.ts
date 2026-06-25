interface Req {
  query: { state?: string };
  session: { oauth_state?: string };
}

declare function verifyState(s?: string): boolean;

// ok: auth.oauth.no-state-validation
export function goodCallback(req: Req) {
  if (req.session.oauth_state !== req.query.state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}

// ok: auth.oauth.no-state-validation -- reversed operand order is still validation
export function goodCallbackReversed(req: Req) {
  if (req.query.state !== req.session.oauth_state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}

// ok: auth.oauth.no-state-validation -- validated via a helper
export function goodCallbackHelper(req: Req) {
  if (!verifyState(req.query.state)) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}

// ok: auth.oauth.no-state-validation -- state captured into a local, then validated
export function goodCallbackViaLocal(req: Req) {
  const state = req.query.state;
  if (req.session.oauth_state !== state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}

// ok: auth.oauth.no-state-validation -- searchParams read into a local, then validated
export function goodCallbackSearchParams(url: URL, stored?: string) {
  const state = url.searchParams.get('state');
  if (!stored || stored !== state) {
    throw new Error('CSRF: state mismatch');
  }
  return true;
}
