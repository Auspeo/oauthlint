import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

// ok: auth.express.cookie-parser-secret -- secret loaded from the environment
app.use(cookieParser(process.env.COOKIE_SECRET));

// ok: auth.express.cookie-parser-secret -- secret from config, not a literal
app.use(cookieParser(config.cookieSecret, { decode: decodeURIComponent }));

// ok: auth.express.cookie-parser-secret -- no secret, unsigned cookies only
app.use(cookieParser());
