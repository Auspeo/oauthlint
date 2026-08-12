import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import io.jsonwebtoken.Jwts;
import java.security.PublicKey;
import javax.crypto.SecretKey;

class TokenValidator {

    // Auth0 java-jwt: signature verified, but issuer/audience never pinned.
    DecodedJWT auth0Bare(String token, Algorithm alg) {
        // ruleid: auth.java.jwt.no-claims-validation
        return JWT.require(alg).build().verify(token);
    }

    // Auth0 java-jwt: an intermediate builder call, still no recipient pinned.
    DecodedJWT auth0Leeway(String token, Algorithm alg) {
        // ruleid: auth.java.jwt.no-claims-validation
        return JWT.require(alg)
                .acceptLeeway(60)
                .build()
                .verify(token);
    }

    // jjwt: signature key set, but requireIssuer/requireAudience missing.
    void jjwtParserBuilder(String token, SecretKey key) {
        // ruleid: auth.java.jwt.no-claims-validation
        Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }

    // jjwt: verifyWith key set, but no recipient claims required.
    void jjwtParser(String token, PublicKey key) {
        // ruleid: auth.java.jwt.no-claims-validation
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }
}
