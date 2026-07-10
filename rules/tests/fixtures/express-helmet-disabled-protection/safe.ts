import express from 'express';
import helmet from 'helmet';

const app = express();

// ok: auth.express.helmet-disabled-protection -- all defaults on
app.use(helmet());

// ok: auth.express.helmet-disabled-protection -- CSP configured, not disabled
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'self'"] },
    },
  }),
);

// ok: auth.express.helmet-disabled-protection -- HSTS tuned, not disabled
app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }));
