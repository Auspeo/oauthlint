import jwt from 'jsonwebtoken';

// ruleid: auth.jwt.weak-secret
export const token1 = jwt.sign({ uid: 1 }, 'secret');

// ruleid: auth.jwt.weak-secret
export const token2 = jwt.sign({ uid: 2 }, 'changeme');

// ruleid: auth.jwt.weak-secret
export function verifyBad(t: string) {
  return jwt.verify(t, 'mySecret');
}

import { sign } from 'jsonwebtoken';
// ruleid: auth.jwt.weak-secret -- destructured import
export const token3 = sign({ uid: 3 }, 'secret');
