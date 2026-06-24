# `auth.java.tls.trust-all-certs`

> TLS hostname verification is disabled. A permissive `HostnameVerifier`

| | |
|---|---|
| **OAuthLint id** | `AUTH-JAVA-TLS-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-295](https://cwe.mitre.org/data/definitions/295.html) |
| **OWASP** | A02:2021 |
| **Languages** | java |
| **Technologies** | javax.net.ssl, apache-httpclient |

## Why this matters

TLS hostname verification is disabled. A permissive `HostnameVerifier`
that returns `true` for every host — or Apache HttpClient's
`NoopHostnameVerifier` — accepts any certificate regardless of the name
it was issued for, so a man-in-the-middle can present a certificate for a
different domain and the connection succeeds (CWE-295). This is a common
AI-generated mistake — the verifier is stubbed out to "fix" a handshake
or certificate error during development and shipped to production.

Never accept all hosts. Leave the default hostname verification in place
(do not call `setHostnameVerifier`/`setDefaultHostnameVerifier` with a
permissive verifier), or fix the trust chain by supplying a proper
truststore so the certificate validates normally.

## ❌ Vulnerable

```java
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSession;
import org.apache.http.conn.ssl.NoopHostnameVerifier;

class TrustAllCerts {

    void lambdaVerifier(HttpsURLConnection conn) {
        // ruleid: auth.java.tls.trust-all-certs
        conn.setHostnameVerifier((hostname, session) -> true);
    }

    void anonymousVerifier(HttpsURLConnection conn) {
        // ruleid: auth.java.tls.trust-all-certs
        conn.setHostnameVerifier(new HostnameVerifier() {
            public boolean verify(String hostname, SSLSession session) {
                return true;
            }
        });
    }

    HostnameVerifier noopVerifier() {
        // ruleid: auth.java.tls.trust-all-certs
        return new NoopHostnameVerifier();
    }
}
```

## ✅ Safe

```java
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSession;
import java.net.URL;

class SafeTls {

    // A verifier that actually checks the hostname against an allowlist.
    void realVerifier(HttpsURLConnection conn) {
        // ok: auth.java.tls.trust-all-certs
        conn.setHostnameVerifier(new HostnameVerifier() {
            public boolean verify(String hostname, SSLSession session) {
                return "api.example.com".equals(hostname)
                        || hostname.endsWith(".trusted.example.com");
            }
        });
    }

    // Default verification: never touch setHostnameVerifier.
    String defaultVerification(URL url) throws Exception {
        // ok: auth.java.tls.trust-all-certs
        HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
        conn.connect();
        return conn.getCipherSuite();
    }
}
```

## Suppressing this rule (when you really must)

```ts
// oauthlint-disable-next-line auth.java.tls.trust-all-certs -- <reason>
thisLineWouldOtherwiseTriggerTheRule();
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://cwe.mitre.org/data/definitions/295.html
- https://docs.oracle.com/javase/8/docs/api/javax/net/ssl/HostnameVerifier.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
