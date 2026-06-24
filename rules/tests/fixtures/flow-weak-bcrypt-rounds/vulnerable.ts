// `bcrypt` here is the bcryptjs package — the API surface is identical and
// LLMs frequently alias it to `bcrypt` on import.
import bcrypt from 'bcryptjs';

// ruleid: auth.flow.weak-bcrypt-rounds
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 8);
}

// ruleid: auth.flow.weak-bcrypt-rounds
export async function makeSalt() {
  return bcrypt.genSalt(5);
}

// ruleid: auth.flow.weak-bcrypt-rounds
export function hashSyncPassword(pw: string) {
  return bcrypt.hashSync(pw, 9);
}

// ruleid: auth.flow.weak-bcrypt-rounds -- hash with 3-arg callback form
export function hashWithCallback(pw: string) {
  bcrypt.hash(pw, 4, (_err, _hash) => {});
}

// ruleid: auth.flow.weak-bcrypt-rounds -- genSaltSync low cost
export function makeSaltSync() {
  return bcrypt.genSaltSync(6);
}
