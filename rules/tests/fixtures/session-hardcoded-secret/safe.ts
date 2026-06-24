import session from 'express-session';
import cookieSession from 'cookie-session';

// ok: auth.session.hardcoded-secret -- loaded from the environment
app.use(session({ secret: process.env.SESSION_SECRET! }));

// ok: auth.session.hardcoded-secret -- pulled from config object
app.use(session({ secret: config.sessionSecret, resave: false }));

// ok: auth.session.hardcoded-secret -- resolved at runtime via secret manager
app.use(cookieSession({ secret: loadSecret(), name: 'sess' }));
