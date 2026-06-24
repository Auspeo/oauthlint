import session from 'express-session';
import cookieSession from 'cookie-session';

// ruleid: auth.session.hardcoded-secret
app.use(session({ secret: 'keyboard cat' }));

// ruleid: auth.session.hardcoded-secret
app.use(session({ secret: 'mysecret', resave: false, saveUninitialized: false }));

// ruleid: auth.session.hardcoded-secret
app.use(cookieSession({ secret: 'abc123', name: 'sess' }));

// ruleid: auth.session.hardcoded-secret
const middleware = session({
  secret: 'super-secret-prod-key',
  cookie: { maxAge: 3600000 },
});
