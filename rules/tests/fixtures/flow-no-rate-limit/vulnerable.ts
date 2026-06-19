type Handler = (...args: unknown[]) => unknown;
declare const app: { post: (path: string, handler: Handler) => void };
declare const router: { post: (path: string, handler: Handler) => void };
declare const fastify: { post: (path: string, handler: Handler) => void };

function loginHandler(_req: unknown, _res: unknown) {
  /* ... */
}

// ruleid: auth.flow.no-rate-limit
app.post('/login', loginHandler);

// ruleid: auth.flow.no-rate-limit
app.post('/signin', loginHandler);

// ruleid: auth.flow.no-rate-limit
app.post('/reset-password', loginHandler);

// ruleid: auth.flow.no-rate-limit -- router, not app
router.post('/auth/login', loginHandler);

// ruleid: auth.flow.no-rate-limit -- fastify
fastify.post('/login', loginHandler);

// ruleid: auth.flow.no-rate-limit -- path prefix
app.post('/api/v1/login', loginHandler);
