import session from 'express-session';
import cookieSession from 'cookie-session';

const app = express();

// ruleid: auth.express.cookie-insecure
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

// ruleid: auth.express.cookie-insecure
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    cookie: { maxAge: 3600000, httpOnly: false },
  }),
);

// ruleid: auth.express.cookie-insecure
const middleware = expressSession({
  secret: process.env.SESSION_SECRET!,
  cookie: { secure: false, httpOnly: true },
});

// ruleid: auth.express.cookie-insecure
app.use(
  cookieSession({
    name: 'sess',
    keys: [process.env.SESSION_KEY!],
    secure: false,
  }),
);

// ruleid: auth.express.cookie-insecure
app.use(
  cookieSession({
    name: 'sess',
    keys: [process.env.SESSION_KEY!],
    httpOnly: false,
  }),
);
