interface Req {
  session: {
    user?: unknown;
    userId?: number;
    regenerate: (cb: (err?: Error) => void) => void;
  };
}

// ok: auth.session.no-regeneration
export function loginGood(req: Req, user: { id: number; email: string }) {
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.user = user;
  });
}
