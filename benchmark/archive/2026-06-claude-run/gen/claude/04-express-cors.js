// Express API configured for cross-origin requests from a React SPA hosted on
// a different domain, using cookie-based sessions.
//
// Setup:
//   npm install express cors express-session
//   node 04-express-cors.js
//
// Notes on cross-domain cookies:
//   - The frontend must send requests with `credentials: "include"` (fetch) or
//     `withCredentials: true` (axios) so the browser attaches/stores the cookie.
//   - CORS `origin` must be an explicit value (NOT "*") when credentials are
//     used, and `credentials: true` must be set.
//   - The session cookie must use `SameSite=None; Secure` for the browser to
//     send it across sites. `Secure` requires HTTPS, so in production this API
//     and the frontend must both be served over HTTPS.

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

// Frontend origin(s) allowed to make credentialed requests.
// In production set FRONTEND_ORIGIN to your deployed React app's URL.
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || "http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim());

// Trust the reverse proxy (needed so Secure cookies work behind a load
// balancer / when terminating TLS upstream, e.g. Heroku, Nginx, etc.).
app.set("trust proxy", 1);

app.use(express.json());

// ---- CORS ----
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, server-to-server) that send no Origin.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---- Sessions (cookie-backed) ----
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-only-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // not readable by client-side JS
      // SameSite=None is required for cross-site cookies; it MUST be paired
      // with Secure. In local dev (http) fall back to "lax".
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction, // HTTPS-only in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    // For real apps use a persistent store (connect-redis, etc.) instead of
    // the default in-memory store.
  })
);

// ---- Demo "user database" ----
const users = {
  "alice@example.com": { password: "password123", name: "Alice" },
};

// ---- Routes ----

// Log in: validate credentials and establish a session. The Set-Cookie header
// is sent automatically by express-session.
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = users[email];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Store identity on the session; never store the password.
  req.session.userId = email;
  req.session.name = user.name;

  return res.json({ ok: true, user: { email, name: user.name } });
});

// Auth guard middleware.
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Return the currently logged-in user (the React app calls this on load to
// check whether the session cookie is still valid).
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ email: req.session.userId, name: req.session.name });
});

// Log out: destroy the session and clear the cookie.
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});

module.exports = app;
