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
