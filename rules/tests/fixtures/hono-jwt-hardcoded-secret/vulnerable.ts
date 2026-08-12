import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const app = new Hono();

// ruleid: auth.hono.jwt-hardcoded-secret
app.use('/auth/*', jwt({ secret: 'it-is-very-secret' }));

// ruleid: auth.hono.jwt-hardcoded-secret
app.use('/admin/*', jwt({ secret: 'password123', alg: 'HS256' }));
