declare const app: {
  post: (path: string, handler: (...args: unknown[]) => unknown) => void;
};

function loginHandler(_req: unknown, _res: unknown) {
  /* ... */
}

// ruleid: auth.flow.no-rate-limit
app.post('/login', loginHandler);

// ruleid: auth.flow.no-rate-limit
app.post('/signin', loginHandler);

// ruleid: auth.flow.no-rate-limit
app.post('/reset-password', loginHandler);
