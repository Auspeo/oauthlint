import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

class TokenFactory {

    // jjwt: building a token with the unsecured NONE algorithm.
    String jjwtNone(String subject) {
        // ruleid: auth.java.jwt.none-algorithm
        return Jwts.builder().setSubject(subject).signWith(SignatureAlgorithm.NONE, "").compact();
    }

    // Auth0 java-jwt: the none() algorithm factory.
    String auth0None(String subject) {
        // ruleid: auth.java.jwt.none-algorithm
        Algorithm algorithm = Algorithm.none();
        return JWT.create().withSubject(subject).sign(algorithm);
    }
}
