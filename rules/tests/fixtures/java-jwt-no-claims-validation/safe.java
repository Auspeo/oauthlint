import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import io.jsonwebtoken.Jwts;
import java.security.PublicKey;
import javax.crypto.SecretKey;

class TokenValidator {

    // Auth0 java-jwt: issuer AND audience pinned before build().
    DecodedJWT auth0Pinned(String token, Algorithm alg) {
        // ok: auth.java.jwt.no-claims-validation
        return JWT.require(alg)
                .withIssuer("https://idp.example.com")
                .withAudience("https://api.example.com")
                .acceptLeeway(60)
                .build()
                .verify(token);
    }

    // jjwt: recipient claims required alongside the signature key.
    void jjwtPinned(String token, SecretKey key) {
        // ok: auth.java.jwt.no-claims-validation
        Jwts.parserBuilder()
                .setSigningKey(key)
                .requireIssuer("https://idp.example.com")
                .requireAudience("https://api.example.com")
                .build()
                .parseClaimsJws(token);
    }

    // jjwt: verifyWith + recipient assertions in a single chain.
    void jjwtParserPinned(String token, PublicKey key) {
        // ok: auth.java.jwt.no-claims-validation
        Jwts.parser()
                .verifyWith(key)
                .requireIssuer("https://idp.example.com")
                .requireAudience("https://api.example.com")
                .build()
                .parseSignedClaims(token);
    }
}
