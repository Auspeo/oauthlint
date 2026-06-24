# `auth.java.crypto.ecb-mode`

> A JCA `Cipher` is being created in ECB mode (or with a bare algorithm

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-CRYPTO-003` |
| **Severity** | ERROR |
| **LLM prevalence** | MEDIUM |
| **CWE** | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) |
| **OWASP** | A02:2021 |
| **Languages** | java |
| **Technologies** | javax.crypto |

## Why this matters

A JCA `Cipher` is being created in ECB mode (or with a bare algorithm
alias that defaults to ECB). ECB encrypts each block independently, so
identical plaintext blocks produce identical ciphertext blocks — it is
deterministic and leaks structure/patterns of the plaintext (CWE-327).
`Cipher.getInstance("AES")`, `"DES"`, `"DESede"`, or `"Blowfish"` with no
mode specified silently falls back to ECB as well.

Use an authenticated mode: `Cipher.getInstance("AES/GCM/NoPadding")` with
a unique 12-byte IV per message. At minimum use CBC with a random IV plus
a separate HMAC (encrypt-then-MAC). Never use ECB or a bare cipher alias.

## ❌ Vulnerable

```java
import javax.crypto.Cipher;
import javax.crypto.NoSuchPaddingException;
import java.security.NoSuchAlgorithmException;

class EcbModeVulnerable {

    Cipher explicitEcb() throws NoSuchAlgorithmException, NoSuchPaddingException {
        // ruleid: auth.java.crypto.ecb-mode
        return Cipher.getInstance("AES/ECB/PKCS5Padding");
    }

    Cipher bareAesAlias() throws NoSuchAlgorithmException, NoSuchPaddingException {
        // ruleid: auth.java.crypto.ecb-mode
        return Cipher.getInstance("AES");
    }

    Cipher bareDesAlias() throws NoSuchAlgorithmException, NoSuchPaddingException {
        // ruleid: auth.java.crypto.ecb-mode
        return Cipher.getInstance("DES");
    }
}
```

## ✅ Safe

```java
import javax.crypto.Cipher;
import javax.crypto.NoSuchPaddingException;
import java.security.NoSuchAlgorithmException;

class EcbModeSafe {

    // ok: auth.java.crypto.ecb-mode -- authenticated GCM mode
    Cipher gcm() throws NoSuchAlgorithmException, NoSuchPaddingException {
        return Cipher.getInstance("AES/GCM/NoPadding");
    }

    // ok: auth.java.crypto.ecb-mode -- CBC with explicit padding (use a random IV)
    Cipher cbc() throws NoSuchAlgorithmException, NoSuchPaddingException {
        return Cipher.getInstance("AES/CBC/PKCS5Padding");
    }

    // ok: auth.java.crypto.ecb-mode -- asymmetric RSA with OAEP, not symmetric block ECB
    Cipher rsa() throws NoSuchAlgorithmException, NoSuchPaddingException {
        return Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.crypto.ecb-mode -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/327.html
- https://owasp.org/Top10/A02_2021-Cryptographic_Failures/
- https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
