import { randomBytes } from 'node:crypto';

// ok: auth.flow.insecure-random
export const csrfToken = randomBytes(32).toString('base64url');

// ok: auth.flow.insecure-random -- non-security value
export const animationDelay = Math.random() * 200;

// ok: auth.flow.insecure-random -- non-security value
export const pickColor = Math.random();
