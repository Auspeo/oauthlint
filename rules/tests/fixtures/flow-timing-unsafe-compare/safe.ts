import { timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';

// ok: auth.flow.timing-unsafe-compare
export function loginGood(input: string, stored: string) {
  return argon2.verify(stored, input);
}

// ok: auth.flow.timing-unsafe-compare
export function verifyHmacSafe(expected: Buffer, actual: Buffer) {
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ok: auth.flow.timing-unsafe-compare -- comparing non-secret values is fine
export function compareUsernames(a: string, b: string) {
  return a === b;
}

// ok: auth.flow.timing-unsafe-compare -- loose null/presence checks are not comparisons
export function presenceChecks(token?: string) {
  if (token == null) return false;
  if (typeof token != 'string') return false;
  return token.length != 0;
}

// ok: auth.flow.timing-unsafe-compare -- comparing a secret-named value to a
// string literal is not a timing target (the literal is public in source).
export function demoPassword(password: string) {
  return password !== 'password';
}

// ok: auth.flow.timing-unsafe-compare -- boolean-literal / feature-flag checks
export function featureFlag(opts: { idToken?: boolean }) {
  if (opts.idToken === false) return false;
  return opts.idToken !== true;
}
