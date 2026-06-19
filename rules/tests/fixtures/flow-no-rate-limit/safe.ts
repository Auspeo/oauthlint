declare const app: {
  post: (
    path: string,
    middleware: (req: unknown, res: unknown, next: () => void) => void,
    handler: (req: unknown, res: unknown) => void,
  ) => void;
};

const rateLimit = (_opts: { max: number }) =>
  (_req: unknown, _res: unknown, next: () => void) => {
    next();
  };

const loginLimiter = rateLimit({ max: 5 });
function loginHandler(_req: unknown, _res: unknown) {
  /* ... */
}

// ok: auth.flow.no-rate-limit
app.post('/login', loginLimiter, loginHandler);
