# `auth.java.jwt.unsigned-jwt`

> This JWT is created or parsed without a signature, so its contents are

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-JWT-001` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-347](https://cwe.mitre.org/data/definitions/347.html) |
| **OWASP** | API2:2023 |
| **Languages** | java |
| **Technologies** | jjwt, nimbus-jose-jwt |

## Why this matters

This JWT is created or parsed without a signature, so its contents are
neither authenticated nor tamper-proof (CWE-347). An unsecured ("alg=none")
token can be forged by anyone — changing the claims (e.g. the subject or
roles) costs nothing because there is no signature to verify. This is a
common AI-generated mistake: the "plaintext"/"unsecured" JWT API is reached
for during prototyping and never swapped for a signed token.

Sign tokens and verify their signatures. With nimbus-jose-jwt use
`SignedJWT` (and verify with a `JWSVerifier`); with jjwt build tokens via
`Jwts.builder()...signWith(key)` and parse them with `parseSignedClaims`
(or the legacy `parseClaimsJws`) instead of `parseClaimsJwt` /
`parsePlaintextJwt`.

## ❌ Vulnerable

```java
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import io.jsonwebtoken.Jwts;

class UnsignedJwt {

    // nimbus-jose-jwt: building an unsecured ("alg=none") JWT.
    PlainJWT nimbusUnsecured(JWTClaimsSet claims) {
        // ruleid: auth.java.jwt.unsigned-jwt
        return new PlainJWT(claims);
    }

    // jjwt: parsing an unsigned JWT with claims.
    void jjwtParseClaimsJwt(String token, byte[] key) {
        // ruleid: auth.java.jwt.unsigned-jwt
        Jwts.parser().build().parseClaimsJwt(token);
    }

    // jjwt: parsing an unsigned plaintext JWT.
    void jjwtParsePlaintextJwt(String token) {
        // ruleid: auth.java.jwt.unsigned-jwt
        Jwts.parser().build().parsePlaintextJwt(token);
    }
}
```

## ✅ Safe

```java
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;

class SignedJwtOk {

    // nimbus-jose-jwt: a properly signed JWT.
    SignedJWT nimbusSigned(JWTClaimsSet claims, JWSSigner signer) throws Exception {
        // ok: auth.java.jwt.unsigned-jwt
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(signer);
        return jwt;
    }

    // jjwt: build a signed token.
    String jjwtSign(SecretKey key) {
        // ok: auth.java.jwt.unsigned-jwt
        return Jwts.builder().subject("alice").signWith(key).compact();
    }

    // jjwt: parse a signed token, verifying the signature.
    void jjwtParseSigned(String token, SecretKey key) {
        // ok: auth.java.jwt.unsigned-jwt
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.jwt.unsigned-jwt -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://connect2id.com/products/nimbus-jose-jwt/examples/unsecured-jwt
- https://github.com/jwtk/jjwt#reading-a-jwt
- https://cwe.mitre.org/data/definitions/347.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
