# `auth.java.crypto.weak-password-hash`

> A password is being hashed with a fast, general-purpose digest from the

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-CRYPTO-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-916](https://cwe.mitre.org/data/definitions/916.html) |
| **OWASP** | A02:2021 |
| **Languages** | java |
| **Technologies** | java.security |

## Why this matters

A password is being hashed with a fast, general-purpose digest from the
JCA `MessageDigest` (MD5, SHA-1, SHA-256, SHA-512). These algorithms are
designed to be fast, which makes offline brute-force and rainbow-table
attacks cheap — they are NOT suitable for storing passwords (CWE-916).

Use a dedicated, slow password-hashing function with a per-password salt
and a tunable work factor: BCrypt (`BCryptPasswordEncoder`), Argon2
(`Argon2PasswordEncoder`), or PBKDF2 (`Pbkdf2PasswordEncoder` /
`SecretKeyFactory` with `PBKDF2WithHmacSHA256`). These resist brute-force
by design.

## ❌ Vulnerable

```java
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

class WeakPasswordHash {

    byte[] md5Password(String password) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        // ruleid: auth.java.crypto.weak-password-hash
        return md.digest(password.getBytes());
    }

    byte[] sha1Password(String passwd) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        // ruleid: auth.java.crypto.weak-password-hash
        return md.digest(passwd.getBytes("UTF-8"));
    }

    byte[] sha256Password(String userPassword) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        // ruleid: auth.java.crypto.weak-password-hash
        return md.digest(userPassword.getBytes());
    }

    byte[] sha512PasswordUpdate(String pwd) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        // ruleid: auth.java.crypto.weak-password-hash
        md.update(pwd.getBytes());
        return md.digest();
    }
}
```

## ✅ Safe

```java
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

class SafePasswordHash {

    // ok: auth.java.crypto.weak-password-hash -- BCrypt is a proper password hasher
    String bcrypt(String password) {
        return new BCryptPasswordEncoder().encode(password);
    }

    // ok: auth.java.crypto.weak-password-hash -- Argon2 is a proper password hasher
    String argon2(String password) {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8().encode(password);
    }

    // ok: auth.java.crypto.weak-password-hash -- SHA-256 over file bytes is a checksum, not a password
    byte[] fileChecksum(byte[] fileBytes) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return md.digest(fileBytes);
    }

    // ok: auth.java.crypto.weak-password-hash -- non-password fingerprint
    byte[] contentFingerprint(String content) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return md.digest(content.getBytes());
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.crypto.weak-password-hash -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/916.html
- https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
