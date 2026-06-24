# `auth.java.jwt.hardcoded-secret`

> A JWT signing key is hard-coded as a string literal (CWE-798). Anyone with

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-JWT-002` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | API2:2023 |
| **Languages** | java |
| **Technologies** | jjwt |

## Why this matters

A JWT signing key is hard-coded as a string literal (CWE-798). Anyone with
access to the source, the compiled artifact, or the version-control history
can read the secret and forge valid tokens — changing the subject, roles,
or expiry at will, because the signature will still verify. This is a common
AI-generated mistake: a placeholder secret is pasted inline to "make signing
work" and is never moved out of the code.

Load the signing key from outside the source: an environment variable
(`System.getenv("JWT_SECRET")`), a configuration property, or a dedicated
secret manager (Vault, AWS Secrets Manager, etc.). With jjwt, build the key
from those bytes via `Keys.hmacShaKeyFor(secret.getBytes(...))`. Never commit
the key, and rotate any secret that has already been checked in.

## ❌ Vulnerable

```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;

class JwtService {

    SecretKey buildKey() {
        // ruleid: auth.java.jwt.hardcoded-secret
        return Keys.hmacShaKeyFor("super-secret-signing-key-1234567890".getBytes(StandardCharsets.UTF_8));
    }

    String createLegacy(String subject) {
        // ruleid: auth.java.jwt.hardcoded-secret
        return Jwts.builder()
                .setSubject(subject)
                .signWith(SignatureAlgorithm.HS256, "hardcoded-legacy-secret")
                .compact();
    }

    String parseString(String token) {
        // ruleid: auth.java.jwt.hardcoded-secret
        return Jwts.parser()
                .setSigningKey("inline-parser-secret-string")
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    String parseBytes(String token) {
        // ruleid: auth.java.jwt.hardcoded-secret
        return Jwts.parser()
                .setSigningKey("inline-parser-secret-bytes".getBytes(StandardCharsets.UTF_8))
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
```

## ✅ Safe

```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;

class SafeJwtService {

    SecretKey keyFromEnv() {
        String secret = System.getenv("JWT_SECRET");
        // ok: auth.java.jwt.hardcoded-secret
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    SecretKey keyFromVariable(byte[] keyBytes) {
        // ok: auth.java.jwt.hardcoded-secret
        return Keys.hmacShaKeyFor(keyBytes);
    }

    String parseFromEnv(String token, SecretKey key) {
        // ok: auth.java.jwt.hardcoded-secret
        return Jwts.parser()
                .setSigningKey(System.getenv("JWT_SECRET"))
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    String parseWithKey(String token, SecretKey key) {
        // ok: auth.java.jwt.hardcoded-secret
        return Jwts.parser()
                .setSigningKey(key)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.jwt.hardcoded-secret -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://github.com/jwtk/jjwt#signing-key
- https://cwe.mitre.org/data/definitions/798.html
- https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
