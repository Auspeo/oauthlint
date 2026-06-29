import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import javax.crypto.SecretKey;

class TokenFactory {

    // jjwt: a real HMAC signing algorithm.
    String jjwtSigned(String subject, SecretKey key) {
        // ok: auth.java.jwt.none-algorithm
        return Jwts.builder().setSubject(subject).signWith(key, SignatureAlgorithm.HS256).compact();
    }

    // Auth0 java-jwt: HMAC256 with a real secret.
    String auth0Signed(String subject, String secret) {
        // ok: auth.java.jwt.none-algorithm
        Algorithm algorithm = Algorithm.HMAC256(secret);
        return JWT.create().withSubject(subject).sign(algorithm);
    }
}
