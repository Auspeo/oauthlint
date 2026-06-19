interface Req {
  session: {
    user?: unknown;
    userId?: number;
    user_id?: number;
    uid?: number;
    authenticated?: boolean;
    isAuthenticated?: boolean;
    regenerate?: (cb: (err?: Error) => void) => void;
  };
}

export function loginBad(req: Req, user: { id: number; email: string }) {
  // ruleid: auth.session.no-regeneration
  req.session.user = user;
}

export function loginBad2(req: Req, id: number) {
  // ruleid: auth.session.no-regeneration
  req.session.userId = id;
}

export function loginBad3(req: Req) {
  // ruleid: auth.session.no-regeneration
  req.session.authenticated = true;
}
