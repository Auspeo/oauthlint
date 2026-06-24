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
