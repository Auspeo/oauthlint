# `auth.flow.password-plaintext`

> A user-supplied password is being persisted WITHOUT being hashed first.

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-001` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-256](https://cwe.mitre.org/data/definitions/256.html) |
| **OWASP** | API2:2023 |
| **Languages** | javascript, typescript |

## Why this matters

A user-supplied password is being persisted WITHOUT being hashed first.
Storing plaintext passwords means any database read (backup, SQL injection,
misconfigured backup, contractor with read-only access) leaks every
credential in one shot.

Hash with argon2id (recommended), bcrypt, or scrypt before persisting.
Never use plain SHA-256, MD5, or any unsalted hash for passwords.

OWASP ASVS V2.4 mandates an adaptive, salted hash. Every modern stack
ships one — there is no reason to roll your own.

## ❌ Vulnerable

```ts
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
```

## ✅ Safe

```ts
import argon2 from 'argon2';

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
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.password-plaintext -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cwe.mitre.org/data/definitions/256.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
