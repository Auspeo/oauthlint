import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const app = new Hono<{ Bindings: { JWT_SECRET: string } }>();

// Secret sourced from the Workers binding / environment — not a literal.
app.use('/auth/*', (c, next) => jwt({ secret: c.env.JWT_SECRET })(c, next));
app.use('/admin/*', (c, next) => jwt({ secret: process.env.JWT_SECRET!, alg: 'HS256' })(c, next));

// Placeholder stub, not a real secret — allow-listed.
app.use('/api/*', (c, next) => jwt({ secret: 'your-jwt-secret' })(c, next));
