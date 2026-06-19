type Mw = (req: unknown, res: unknown, next: () => void) => void;
type Handler = (req: unknown, res: unknown) => void;
declare const app: {
  post: (path: string, ...rest: (Mw | Handler)[]) => void;
};

const rateLimit =
  (_opts: { max: number }): Mw =>
  (_req, _res, next) => {
    next();
  };

const loginLimiter = rateLimit({ max: 5 });
function loginHandler(_req: unknown, _res: unknown) {
  /* ... */
}

// ok: auth.flow.no-rate-limit -- rate-limit middleware present (3-arg form)
app.post('/login', loginLimiter, loginHandler);

// ok: auth.flow.no-rate-limit -- not a login endpoint
app.post('/products', loginHandler);

// ok: auth.flow.no-rate-limit -- /authorize is the OAuth authorize endpoint, not a credential login
app.post('/oauth/authorize', loginHandler);
