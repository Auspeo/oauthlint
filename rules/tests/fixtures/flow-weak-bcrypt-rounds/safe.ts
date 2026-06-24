import bcrypt from 'bcrypt';

const saltRounds = 12;

// ok: auth.flow.weak-bcrypt-rounds
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

// ok: auth.flow.weak-bcrypt-rounds -- exactly at the recommended floor
export async function makeSalt() {
  return bcrypt.genSalt(10);
}

// ok: auth.flow.weak-bcrypt-rounds -- cost factor comes from a constant
export function hashWithConstant(pw: string) {
  return bcrypt.hashSync(pw, saltRounds);
}

// ok: auth.flow.weak-bcrypt-rounds -- cost factor from config variable
export function hashWithVar(pw: string, rounds: number) {
  return bcrypt.hash(pw, rounds);
}
