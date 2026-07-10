import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

// ruleid: auth.express.cookie-parser-secret
app.use(cookieParser('my-super-secret-key'));

// ruleid: auth.express.cookie-parser-secret
app.use(cookieParser('keyboard cat', { decode: decodeURIComponent }));
