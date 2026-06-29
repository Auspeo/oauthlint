import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSession;
import java.net.URL;
import java.util.function.BiPredicate;

class SafeTls {

    // Negative control: a generic two-arg lambda returning `true` that is NOT a
    // HostnameVerifier. Without context-scoping this matched the verifier rule;
    // it must not fire now.
    BiPredicate<String, String> alwaysTrue() {
        // ok: auth.java.tls.trust-all-certs
        return (a, b) -> true;
    }

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
