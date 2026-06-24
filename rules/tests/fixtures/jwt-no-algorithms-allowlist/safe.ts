import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

// ok: auth.jwt.no-algorithms-allowlist
export const claims1 = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

// ok: auth.jwt.no-algorithms-allowlist -- algorithms + audience pinned together
export const claims2 = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
  audience: 'https://api.example.com',
});

// ok: auth.jwt.no-algorithms-allowlist -- signing is out of scope
export const signed = jwt.sign({ uid: 1 }, secret, { algorithm: 'HS256' });

// ok: auth.jwt.no-algorithms-allowlist -- jose has its own verification API
export const joseClaims = await jwtVerify(token, key);
