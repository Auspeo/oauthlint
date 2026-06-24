import crypto, { createHash, createHmac } from 'node:crypto';
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

declare const password: string;
declare const fileBuffer: Buffer;
declare const payload: string;
declare const hmacKey: string;

// ok: auth.flow.weak-password-hash -- bcrypt is a real password hash
export const b = await bcrypt.hash(password, 12);

// ok: auth.flow.weak-password-hash -- argon2id is a real password hash
export const a = await argon2.hash(password);

// ok: auth.flow.weak-password-hash -- scrypt is a real password hash
crypto.scrypt(password, 'salt', 64, (_err, derivedKey) => {
  void derivedKey;
});

// ok: auth.flow.weak-password-hash -- checksum of a file buffer, not a password
export const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

// ok: auth.flow.weak-password-hash -- generic content digest, not a password
export const etag = createHash('sha1').update(payload).digest('hex');

// ok: auth.flow.weak-password-hash -- HMAC signature, not password hashing
export const sig = createHmac('sha256', hmacKey).update(payload).digest('hex');

// ok: auth.flow.weak-password-hash -- two-step digest over a file buffer
const fileHasher = crypto.createHash('sha512');
fileHasher.update(fileBuffer);
export const fileDigest = fileHasher.digest('hex');
