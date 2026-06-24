# `auth.flow.weak-password-hash`

> A password is being hashed with a fast, general-purpose hash

| | |
|---|---|
| **OAuthLint id** | `AUTH-FLOW-006` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | javascript, typescript |
| **Technologies** | node:crypto |

## Why this matters

A password is being hashed with a fast, general-purpose hash
(MD5/SHA-1/SHA-256/SHA-512 via `crypto.createHash`). These functions
are designed to be FAST, so an attacker who steals the database can
brute-force billions of candidate passwords per second on commodity
GPUs. Salting alone does not fix this.

Use a dedicated, deliberately-slow password hashing function instead:
`bcrypt`, `argon2` (argon2id), or `scrypt` (`crypto.scrypt`). These add
a tunable work factor that makes large-scale brute-forcing infeasible.

## ❌ Vulnerable

```ts
import crypto, { createHash } from 'node:crypto';

declare const password: string;
declare const userPassword: string;
declare const newPasswd: string;
declare const oldPwd: string;

// ruleid: auth.flow.weak-password-hash -- MD5 chained
export const h1 = crypto.createHash('md5').update(password).digest('hex');

// ruleid: auth.flow.weak-password-hash -- SHA-1 chained
export const h2 = crypto.createHash('sha1').update(userPassword).digest('hex');

// ruleid: auth.flow.weak-password-hash -- SHA-256 chained, destructured import
export const h3 = createHash('sha256').update(newPasswd).digest('base64');

// ruleid: auth.flow.weak-password-hash -- SHA-512 chained with encoding arg
export const h4 = crypto.createHash('sha512').update(oldPwd, 'utf8').digest('hex');

// ruleid: auth.flow.weak-password-hash -- two-step form
const hasher = crypto.createHash('sha256');
hasher.update(password);
export const h5 = hasher.digest('hex');

export function hashPassword(pwd: string): string {
  // ruleid: auth.flow.weak-password-hash -- param named like a password
  return crypto.createHash('sha256').update(pwd).digest('hex');
}
```

## ✅ Safe

```ts
import crypto, { createHash, createHmac } from 'node:crypto';
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

declare const password: string;
declare const fileBuffer: Buffer;
declare const payload: string;
declare const hmacKey: string;

// ok: auth.flow.weak-password-hash -- bcrypt is a real password hash
export const b = await bcrypt.hash(password, 12);

// ok: auth.flow.weak-password-hash -- argon2id is a real password hash
export const a = await argon2.hash(password);

// ok: auth.flow.weak-password-hash -- scrypt is a real password hash
crypto.scrypt(password, 'salt', 64, (_err, derivedKey) => {
  void derivedKey;
});

// ok: auth.flow.weak-password-hash -- checksum of a file buffer, not a password
export const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

// ok: auth.flow.weak-password-hash -- generic content digest, not a password
export const etag = createHash('sha1').update(payload).digest('hex');

// ok: auth.flow.weak-password-hash -- HMAC signature, not password hashing
export const sig = createHmac('sha256', hmacKey).update(payload).digest('hex');

// ok: auth.flow.weak-password-hash -- two-step digest over a file buffer
const fileHasher = crypto.createHash('sha512');
fileHasher.update(fileBuffer);
export const fileDigest = fileHasher.digest('hex');
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.flow.weak-password-hash -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cwe.mitre.org/data/definitions/916.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
