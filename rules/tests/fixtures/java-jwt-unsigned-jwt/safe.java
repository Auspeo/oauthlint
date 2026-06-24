import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;

class SignedJwtOk {

    // nimbus-jose-jwt: a properly signed JWT.
    SignedJWT nimbusSigned(JWTClaimsSet claims, JWSSigner signer) throws Exception {
        // ok: auth.java.jwt.unsigned-jwt
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(signer);
        return jwt;
    }

    // jjwt: build a signed token.
    String jjwtSign(SecretKey key) {
        // ok: auth.java.jwt.unsigned-jwt
        return Jwts.builder().subject("alice").signWith(key).compact();
    }

    // jjwt: parse a signed token, verifying the signature.
    void jjwtParseSigned(String token, SecretKey key) {
        // ok: auth.java.jwt.unsigned-jwt
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }
}
