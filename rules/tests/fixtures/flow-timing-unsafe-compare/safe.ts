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
