import axios from 'axios';
import fs from 'node:fs';
import https from 'node:https';

declare const url: string;

// ok: auth.tls.reject-unauthorized -- validation explicitly kept on
const strictAgent = new https.Agent({ rejectUnauthorized: true });

// ok: auth.tls.reject-unauthorized -- plain request, default validation applies
const res = https.get(url);

// ok: auth.tls.reject-unauthorized -- pins a private CA instead of disabling checks
const pinnedAgent = new https.Agent({ ca: fs.readFileSync('ca.pem') });

// ok: auth.tls.reject-unauthorized -- axios call with no insecure options
const data = axios.get(url, { timeout: 5000 });

export { strictAgent, res, pinnedAgent, data };
