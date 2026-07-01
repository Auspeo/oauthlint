import session from 'express-session';
import cookieSession from 'cookie-session';

const app = express();

// ok: auth.express.cookie-insecure -- both flags explicitly hardened
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true },
  }),
);

// ok: auth.express.cookie-insecure -- no `secure` key at all (undecidable dev vs prod, must NOT fire)
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    cookie: { maxAge: 3600000 },
  }),
);

// ok: auth.express.cookie-insecure -- gated on environment rather than hard-coded false
app.use(
  cookieSession({
    name: 'sess',
    keys: [process.env.SESSION_KEY!],
    secure: process.env.NODE_ENV === 'production',
  }),
);

// ok: auth.express.cookie-insecure -- res.cookie is covered by auth.cookie.* rules, not this one
app.get('/', (req, res) => {
  res.cookie('sid', 'abc', { secure: false });
  res.send('ok');
});
