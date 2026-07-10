import express from 'express';

const app = express();

// ok: auth.express.trust-proxy-true -- bounded hop count (one proxy in front)
app.set('trust proxy', 1);

// ok: auth.express.trust-proxy-true -- a specific preset, not "all proxies"
app.set('trust proxy', 'loopback');

// ok: auth.express.trust-proxy-true -- an explicit allowlist of trusted addresses
app.set('trust proxy', ['loopback', '127.0.0.1', '10.0.0.0/8']);

// ok: auth.express.trust-proxy-true -- trust disabled entirely
app.set('trust proxy', false);
app.disable('trust proxy');

// ok: auth.express.trust-proxy-true -- an unrelated setting, not trust proxy
app.set('view engine', 'pug');
