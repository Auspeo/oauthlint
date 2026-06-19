interface Req {
  session: {
    user?: unknown;
    userId?: number;
    regenerate: (cb: (err?: Error) => void) => void;
  };
}

// ok: auth.session.no-regeneration -- callback form
export function loginGood(req: Req, user: { id: number; email: string }) {
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.user = user;
  });
}

// ok: auth.session.no-regeneration -- promisified async form (regenerate first)
export async function loginGoodAsync(req: Req, user: { id: number; email: string }) {
  await new Promise<void>((resolve) => req.session.regenerate(() => resolve()));
  req.session.user = user;
}
