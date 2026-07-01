import type { ModelAdapter } from './types.js';

/**
 * A deterministic, offline adapter. It never touches the network: it returns
 * canned auth code selected by a stable hash of the prompt. The canned samples
 * DELIBERATELY contain real anti-patterns the OAuthLint pack detects (an
 * insecure session cookie, `jwt.decode()` without verification, a `none`
 * algorithm allowlist, wildcard CORS with credentials, a token in
 * `localStorage`, PyJWT `verify=False`, a weak passlib scheme, ...). That makes
 * the whole pipeline testable end to end with no API keys, and gives the report
 * something concrete to tally.
 *
 * The mock is a test/reference fixture, not a portrayal of any real model.
 */

/** Simple, stable string hash (djb2). Deterministic across runs and platforms. */
function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * Python cues shared by the Python prompts in the suite. When a prompt is for
 * Python we must return Python source, otherwise the scanner (which uses the
 * prompt's declared language for the file extension) cannot parse it. JavaScript
 * and TypeScript share a parser, so one pool covers both.
 */
const PYTHON_CUE = /\bpython\b|fastapi|flask|pyjwt|\brequests\b/i;

/** JS/TS canned samples, each carrying at least one detectable anti-pattern. */
const JS_SAMPLES: readonly string[] = [
  // Insecure express-session cookie + jwt.decode() without verification.
  `const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(
  session({
    secret: 'keyboard-cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: false },
  }),
);

app.post('/login', (req, res) => {
  const token = req.body.token;
  const claims = jwt.decode(token);
  req.session.userId = claims.sub;
  res.json({ ok: true });
});

module.exports = app;
`,
  // Wildcard CORS with credentials + a 'none' algorithm in the allowlist.
  `const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: '*', credentials: true }));

function checkToken(token, secret) {
  return jwt.verify(token, secret, { algorithms: ['none', 'HS256'] });
}

app.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const payload = checkToken(header.replace('Bearer ', ''), process.env.SECRET);
  res.json(payload);
});

module.exports = { app, checkToken };
`,
  // OAuth access token persisted in localStorage from a browser SPA.
  `export async function login(email, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
}

export function authHeader() {
  const token = localStorage.getItem('access_token');
  return { Authorization: 'Bearer ' + token };
}
`,
];

/** Python canned samples, each carrying at least one detectable anti-pattern. */
const PY_SAMPLES: readonly string[] = [
  // PyJWT decode with signature verification disabled.
  `import jwt


def decode_token(token):
    # Read the claims out of the token.
    return jwt.decode(token, verify=False)
`,
  // FastAPI CORS wide open with credentials allowed.
  `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
`,
  // Insecure Flask session cookie config + a weak passlib scheme.
  `from flask import Flask
from passlib.context import CryptContext

app = Flask(__name__)
app.secret_key = "dev-secret"
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False

pwd_context = CryptContext(schemes=["md5_crypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)
`,
];

function pick(samples: readonly string[], seed: number): string {
  return samples[seed % samples.length] as string;
}

/**
 * The offline reference adapter. `id` is `mock`; `generate` is pure and
 * deterministic: the same prompt always yields the same code.
 */
export class MockAdapter implements ModelAdapter {
  readonly id = 'mock';

  async generate(prompt: string): Promise<string> {
    const seed = hash(prompt);
    const pool = PYTHON_CUE.test(prompt) ? PY_SAMPLES : JS_SAMPLES;
    return pick(pool, seed);
  }
}
