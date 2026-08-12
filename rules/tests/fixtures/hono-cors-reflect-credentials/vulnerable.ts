import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// ruleid: auth.hono.cors-reflect-credentials
app.use('/api/*', cors({ origin: (origin) => origin, credentials: true }));

// ruleid: auth.hono.cors-reflect-credentials
app.use('/v2/*', cors({ credentials: true, origin: (origin, c) => origin }));
