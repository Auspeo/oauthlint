# `auth.java.crypto.insecure-random`

> A security-sensitive value (token, secret, key, password, nonce, OTP, or

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-CRYPTO-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-330](https://cwe.mitre.org/data/definitions/330.html) |
| **OWASP** | A02:2021 |
| **Languages** | java |
| **Technologies** | java.util |

## Why this matters

A security-sensitive value (token, secret, key, password, nonce, OTP, or
salt) is generated with a non-cryptographic PRNG. `java.util.Random` and
`Math.random()` are predictable: their output is seeded from system time
and the internal state can be recovered from a few observed values, so an
attacker can reconstruct the "random" secret (CWE-330). This is a common
AI-generated mistake — `new Random().nextInt(...)` gets pasted in to
produce a token because it looks random enough.

Use `java.security.SecureRandom` instead. For example,
`new SecureRandom().nextBytes(buf)` to fill a byte buffer, then encode it
(Base64/hex) to build the token or secret.

## ❌ Vulnerable

```java
import java.util.Random;

class TokenFactory {

    String makeToken() {
        // ruleid: auth.java.crypto.insecure-random
        long token = new Random().nextLong();
        return Long.toHexString(token);
    }

    double makeSecret() {
        // ruleid: auth.java.crypto.insecure-random
        double secret = Math.random();
        return secret;
    }

    int makeOtp() {
        // ruleid: auth.java.crypto.insecure-random
        int otp = new java.util.Random().nextInt(1000000);
        return otp;
    }

    byte[] makeKeyBytes() {
        Random rnd = new Random();
        byte[] keyMaterial = new byte[32];
        // ruleid: auth.java.crypto.insecure-random
        rnd.nextBytes(keyMaterial);
        return keyMaterial;
    }
}
```

## ✅ Safe

```java
import java.security.SecureRandom;
import java.util.Random;

class SafeTokenFactory {

    byte[] makeKeyBytes() {
        SecureRandom rnd = new SecureRandom();
        byte[] keyMaterial = new byte[32];
        // ok: auth.java.crypto.insecure-random
        rnd.nextBytes(keyMaterial);
        return keyMaterial;
    }

    long makeSecureToken() {
        // ok: auth.java.crypto.insecure-random
        long token = new SecureRandom().nextLong();
        return token;
    }

    int pickShardIndex() {
        // ok: auth.java.crypto.insecure-random
        int idx = new Random().nextInt(10);
        return idx;
    }

    int jitterMillis() {
        Random rnd = new Random();
        // ok: auth.java.crypto.insecure-random
        int jitter = rnd.nextInt(500);
        return jitter;
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.crypto.insecure-random -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://docs.oracle.com/javase/8/docs/api/java/security/SecureRandom.html
- https://cwe.mitre.org/data/definitions/330.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
