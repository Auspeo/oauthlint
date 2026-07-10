import express from 'express';

const app = express();

// ok: auth.express.auth-middleware-noop -- real guard: it inspects the request
function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).end();
  }
  next();
}

// ok: auth.express.auth-middleware-noop -- real guard as an arrow function
const ensureAuthenticated = (req, res, next) => {
  if (!req.user) return res.status(403).end();
  return next();
};

// ok: auth.express.auth-middleware-noop -- not an auth guard (logging pass-through)
const requestLogger = (req, res, next) => next();

// ok: auth.express.auth-middleware-noop -- error handler (4 args), not an auth guard
function errorHandler(err, req, res, next) {
  next(err);
}

app.get('/admin', requireAuth, (req, res) => res.send('secret'));
