import jwt from 'jsonwebtoken';
import { decodeJwt } from 'jose';

declare const token: string;

// ok: auth.jwt.decode-without-verify -- verify() checks the signature
const verified = jwt.verify(token, process.env.JWT_SECRET!, {
  algorithms: ['RS256'],
});

// ok: auth.jwt.decode-without-verify -- jose.decodeJwt is a different library, out of scope
const joseClaims = decodeJwt(token);

// ok: auth.jwt.decode-without-verify -- a custom decode() unrelated to jsonwebtoken
function decode(value: string): string {
  return Buffer.from(value, 'base64').toString('utf8');
}
const custom = decode(token);

export { verified, joseClaims, custom };
