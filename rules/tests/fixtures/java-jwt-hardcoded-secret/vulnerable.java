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
