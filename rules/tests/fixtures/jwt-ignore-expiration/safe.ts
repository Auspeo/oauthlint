import jwt from 'jsonwebtoken';
import { decode } from 'jsonwebtoken';

declare const token: string;
declare const key: string;

// ok: auth.jwt.ignore-expiration -- exp is enforced (no ignoreExpiration option)
const a = jwt.verify(token, key, { algorithms: ['RS256'] });

// ok: auth.jwt.ignore-expiration -- maxAge tightens expiry rather than disabling it
const b = jwt.verify(token, key, { maxAge: '2h' });

// ok: auth.jwt.ignore-expiration -- ignoreExpiration explicitly false keeps the exp check
const c = jwt.verify(token, key, { ignoreExpiration: false });

// ok: auth.jwt.ignore-expiration -- a bare verify with no options object
const d = jwt.verify(token, key);

// ok: auth.jwt.ignore-expiration -- decode is a different jsonwebtoken API, out of scope
const e = decode(token);

export { a, b, c, d, e };
