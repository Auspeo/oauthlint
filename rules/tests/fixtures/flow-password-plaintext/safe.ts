import argon2 from 'argon2';

declare const db: {
  users: { create: (data: unknown) => Promise<void> };
};

interface Req {
  body: { email: string; password: string };
}

// ok: auth.flow.password-plaintext
export async function signupGood(req: Req) {
  const password = await argon2.hash(req.body.password);
  await db.users.create({ email: req.body.email, password });
}

// ok: auth.flow.password-plaintext
export async function signupGood2(req: Req) {
  await db.users.create({
    email: req.body.email,
    password: await argon2.hash(req.body.password),
  });
}
