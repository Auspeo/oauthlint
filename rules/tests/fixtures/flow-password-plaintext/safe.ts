import argon2 from 'argon2';
import bcrypt from 'bcrypt';

declare const db: {
  users: { create: (data: unknown) => Promise<void> };
};

interface Req {
  body: { email: string; password: string };
}

// ok: auth.flow.password-plaintext
export async function signupGood(req: Req) {
  const hashedPassword = await argon2.hash(req.body.password);
  await db.users.create({ email: req.body.email, password: hashedPassword });
}

// ok: auth.flow.password-plaintext
export async function signupGood2(req: Req) {
  await db.users.create({
    email: req.body.email,
    password: await argon2.hash(req.body.password),
  });
}

// ok: auth.flow.password-plaintext -- hashed into an intermediate variable whose
// name does not contain "hash"; the old rule fired here (the reported false
// positive). The value persisted is `secured`, not a raw `.password` reference.
export async function signupGood3(req: Req) {
  const secured = await bcrypt.hash(req.body.password, 10);
  await db.users.create({ email: req.body.email, password: secured });
}

// ok: auth.flow.password-plaintext -- same shape via a differently-named hash var.
export async function signupGood4(req: Req) {
  const digest = await bcrypt.hash(req.body.password, 10);
  await db.users.create({ email: req.body.email, password: digest });
}
