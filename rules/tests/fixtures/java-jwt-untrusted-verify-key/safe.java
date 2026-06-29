import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Key;
import java.security.KeyStore;
import javax.crypto.SecretKey;

class TokenVerifier {

    // Key resolved from server-side configuration — never from the request.
    Object fromConfig(String token) {
        SecretKey key = Keys.hmacShaKeyFor(System.getenv("JWT_SECRET").getBytes());
        // ok: auth.java.jwt.untrusted-verify-key
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }

    // A `kid` from the request only selects a pre-registered key from a
    // keystore; the key handed to the parser is trusted, not attacker-supplied.
    Object byTrustedKid(HttpServletRequest request, KeyStore ks, String token) throws Exception {
        String kid = request.getParameter("kid");
        Key key = ks.getKey(kid, null);
        // ok: auth.java.jwt.untrusted-verify-key
        return Jwts.parser().setSigningKey(key).build().parseSignedClaims(token);
    }
}
