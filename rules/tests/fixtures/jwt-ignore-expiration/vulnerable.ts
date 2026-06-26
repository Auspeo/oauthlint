import jwt from 'jsonwebtoken';
import { verify } from 'jsonwebtoken';

declare const token: string;
declare const key: string;

// ruleid: auth.jwt.ignore-expiration
const a = jwt.verify(token, key, { ignoreExpiration: true });

// ruleid: auth.jwt.ignore-expiration
const b = jwt.verify(token, key, { algorithms: ['RS256'], ignoreExpiration: true });

// ruleid: auth.jwt.ignore-expiration
const c = jwt.verify(token, key, { ignoreExpiration: true, audience: 'api' });

// ruleid: auth.jwt.ignore-expiration
const d = verify(token, key, { ignoreExpiration: true });

export { a, b, c, d };
