import { randomBytes } from 'node:crypto';

// ok: auth.flow.insecure-random
export const csrfToken = randomBytes(32).toString('base64url');

// ok: auth.flow.insecure-random -- non-security value
export const animationDelay = Math.random() * 200;

// ok: auth.flow.insecure-random -- non-security value
export const pickColor = Math.random();

// These names contain security-word *substrings* but are not secrets, and use
// Math.random() legitimately — regression guards against substring matches.
// ok: auth.flow.insecure-random -- "barcode" is not a security token
export const barcode = Math.random().toString(36);
// ok: auth.flow.insecure-random -- "zipcode" is not a security token
export const zipcode = Math.random().toString().slice(2, 7);
// ok: auth.flow.insecure-random -- camelCase, unrelated UI state
export const gameState = Math.random();
