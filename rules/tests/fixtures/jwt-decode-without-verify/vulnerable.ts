import jwt from 'jsonwebtoken';
import { decode } from 'jsonwebtoken';

declare const token: string;
declare const t: string;
declare const req: { headers: { authorization: string } };

// ruleid: auth.jwt.decode-without-verify
const p = jwt.decode(token);

// ruleid: auth.jwt.decode-without-verify
const fromHeader = jwt.decode(req.headers.authorization);

// ruleid: auth.jwt.decode-without-verify
const { sub } = jwt.decode(t) as { sub: string };

// ruleid: auth.jwt.decode-without-verify
const complete = jwt.decode(token, { complete: true });

// ruleid: auth.jwt.decode-without-verify
const viaImport = decode(token);

export { p, fromHeader, sub, complete, viaImport };
