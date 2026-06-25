// Express JWT auth: POST /login issues a token, requireAuth protects routes.
//
// Run:
//   npm install express jsonwebtoken bcryptjs
//   JWT_SECRET=your-secret node 01-express-jwt.js
//
// Try:
//   curl -s -X POST localhost:3000/login \
//     -H 'content-type: application/json' \
//     -d '{"username":"alice","password":"password123"}'
//   curl -s localhost:3000/profile -H "authorization: Bearer <token>"

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// In production load this from a secrets manager / env, never hardcode.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';
const TOKEN_TTL = '1h';

// Demo "user store". Passwords are stored hashed, never in plaintext.
// Hashes below are for the password "password123".
const users = [
  {
    id: 1,
    username: 'alice',
    // bcrypt hash of "password123"
    passwordHash: bcrypt.hashSync('password123', 10),
    roles: ['user'],
  },
  {
    id: 2,
    username: 'admin',
    passwordHash: bcrypt.hashSync('password123', 10),
    roles: ['user', 'admin'],
  },
];

function findUser(username) {
  return users.find((u) => u.username === username);
}

// POST /login -> { token }
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = findUser(username);

  // Always run a compare even when the user is missing to avoid leaking, via
  // timing, whether the username exists. Return the same error either way.
  const passwordOk = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv');

  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, roles: user.roles },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );

  return res.json({ token, token_type: 'Bearer', expires_in: TOKEN_TTL });
});

// Middleware: verifies the Bearer JWT and attaches req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles || [],
    };
    return next();
  } catch (err) {
    const reason =
      err.name === 'TokenExpiredError' ? 'token expired' : 'invalid token';
    return res.status(401).json({ error: reason });
  }
}

// Optional: role gate built on top of requireAuth.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

// Protected routes
app.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: `welcome, admin ${req.user.username}` });
});

// Public health check
app.get('/health', (req, res) => res.json({ ok: true }));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on http://localhost:${port}`));
}

module.exports = { app, requireAuth, requireRole };
