import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
const allowed = ['https://app.example.com'];

// Explicit allow-list with credentials — safe.
app.use('/api/*', cors({ origin: ['https://app.example.com'], credentials: true }));

// Callback validates the origin against an allow-list — safe.
app.use('/v2/*', cors({ origin: (o) => (allowed.includes(o) ? o : null), credentials: true }));

// Reflects the origin but WITHOUT credentials (public API) — safe.
app.use('/pub/*', cors({ origin: (origin) => origin }));
