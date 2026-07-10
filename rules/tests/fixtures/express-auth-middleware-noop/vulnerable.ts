import express from 'express';

const app = express();

// ruleid: auth.express.auth-middleware-noop
function requireAuth(req, res, next) {
  next();
}

// ruleid: auth.express.auth-middleware-noop
function ensureAuthenticated(req, res, next) {
  return next();
}

// ruleid: auth.express.auth-middleware-noop
const isLoggedIn = (req, res, next) => next();

// ruleid: auth.express.auth-middleware-noop
const checkAuth = (req, res, next) => {
  next();
};

// ruleid: auth.express.auth-middleware-noop
const protectRoute = (req, res, next) => {
  return next();
};

// ruleid: auth.express.auth-middleware-noop
const authGuard = function (req, res, next) {
  next();
};

app.get('/admin', requireAuth, (req, res) => res.send('secret'));
