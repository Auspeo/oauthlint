import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import io.jsonwebtoken.Jwts;

class UnsignedJwt {

    // nimbus-jose-jwt: building an unsecured ("alg=none") JWT.
    PlainJWT nimbusUnsecured(JWTClaimsSet claims) {
        // ruleid: auth.java.jwt.unsigned-jwt
        return new PlainJWT(claims);
    }

    // jjwt: parsing an unsigned JWT with claims.
    void jjwtParseClaimsJwt(String token, byte[] key) {
        // ruleid: auth.java.jwt.unsigned-jwt
        Jwts.parser().build().parseClaimsJwt(token);
    }

    // jjwt: parsing an unsigned plaintext JWT.
    void jjwtParsePlaintextJwt(String token) {
        // ruleid: auth.java.jwt.unsigned-jwt
        Jwts.parser().build().parsePlaintextJwt(token);
    }
}
