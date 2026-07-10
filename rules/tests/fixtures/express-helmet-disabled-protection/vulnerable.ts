import express from 'express';
import helmet from 'helmet';

const app = express();

// ruleid: auth.express.helmet-disabled-protection
app.use(helmet({ contentSecurityPolicy: false }));

// ruleid: auth.express.helmet-disabled-protection
app.use(helmet({ hsts: false }));

// ruleid: auth.express.helmet-disabled-protection
app.use(helmet({ frameguard: false, hidePoweredBy: true }));

// ruleid: auth.express.helmet-disabled-protection
app.use(helmet({ noSniff: false }));
