import crypto, { createHash } from 'node:crypto';

declare const password: string;
declare const userPassword: string;
declare const newPasswd: string;
declare const oldPwd: string;

// ruleid: auth.flow.weak-password-hash -- MD5 chained
export const h1 = crypto.createHash('md5').update(password).digest('hex');

// ruleid: auth.flow.weak-password-hash -- SHA-1 chained
export const h2 = crypto.createHash('sha1').update(userPassword).digest('hex');

// ruleid: auth.flow.weak-password-hash -- SHA-256 chained, destructured import
export const h3 = createHash('sha256').update(newPasswd).digest('base64');

// ruleid: auth.flow.weak-password-hash -- SHA-512 chained with encoding arg
export const h4 = crypto.createHash('sha512').update(oldPwd, 'utf8').digest('hex');

// ruleid: auth.flow.weak-password-hash -- two-step form
const hasher = crypto.createHash('sha256');
hasher.update(password);
export const h5 = hasher.digest('hex');

export function hashPassword(pwd: string): string {
  // ruleid: auth.flow.weak-password-hash -- param named like a password
  return crypto.createHash('sha256').update(pwd).digest('hex');
}
