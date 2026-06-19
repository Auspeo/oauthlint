declare const db: {
  users: {
    create: (data: unknown) => Promise<void>;
    insert: (data: unknown) => Promise<void>;
  };
};

declare class User {
  constructor(data: unknown);
  static create(data: unknown): Promise<void>;
}

interface Req {
  body: { email: string; password: string };
}

export async function signupBad(req: Req) {
  // ruleid: auth.flow.password-plaintext
  await db.users.create({
    email: req.body.email,
    password: req.body.password,
  });
}

export async function signupBad2(req: Req) {
  // ruleid: auth.flow.password-plaintext
  await User.create({ email: req.body.email, password: req.body.password });
}

export async function signupBad3(req: Req) {
  // ruleid: auth.flow.password-plaintext
  const u = new User({ email: req.body.email, password: req.body.password });
  await db.users.insert(u);
}

declare const prisma: { user: { create: (args: unknown) => Promise<void> } };
declare const userRepo: { save: (data: unknown) => Promise<void> };

export async function signupBad4(req: Req) {
  // ruleid: auth.flow.password-plaintext -- Prisma nested data wrapper
  await prisma.user.create({ data: { email: req.body.email, password: req.body.password } });
}

export async function signupBad5(req: Req) {
  // ruleid: auth.flow.password-plaintext -- repository .save()
  await userRepo.save({ email: req.body.email, password: req.body.password });
}
