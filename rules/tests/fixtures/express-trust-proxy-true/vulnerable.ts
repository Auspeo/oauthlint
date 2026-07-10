import express from 'express';

const app = express();

// ruleid: auth.express.trust-proxy-true
app.set('trust proxy', true);

// ruleid: auth.express.trust-proxy-true
app.enable('trust proxy');
