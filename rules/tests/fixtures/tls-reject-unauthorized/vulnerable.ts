import axios from 'axios';
import https from 'node:https';
import tls from 'node:tls';

declare const url: string;

// A custom HTTPS agent that accepts any certificate — classic MITM hole.
// ruleid: auth.tls.reject-unauthorized
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

// axios call wiring up the same insecure agent inline.
// ruleid: auth.tls.reject-unauthorized
const res = axios.get(url, {
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

// Raw https.request options with validation disabled.
// ruleid: auth.tls.reject-unauthorized
const req = https.request({
  hostname: 'api.example.com',
  port: 443,
  rejectUnauthorized: false,
});

// tls.connect with validation disabled.
// ruleid: auth.tls.reject-unauthorized
const socket = tls.connect({ host: 'api.example.com', port: 443, rejectUnauthorized: false });

// The global escape hatch that disables validation process-wide.
// ruleid: auth.tls.reject-unauthorized
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export { insecureAgent, res, req, socket };
