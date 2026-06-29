import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletRequest;

class TokenVerifier {

    // jjwt: the verification key comes straight from a request parameter.
    Object jjwtParam(HttpServletRequest request, String token) {
        String key = request.getParameter("key");
        // ruleid: auth.java.jwt.untrusted-verify-key
        return Jwts.parser().setSigningKey(key).build().parseSignedClaims(token);
    }

    // jjwt (0.12 API): the key comes from a request header.
    Object jjwtHeader(HttpServletRequest request, String token) {
        byte[] secret = request.getHeader("X-Key").getBytes();
        // ruleid: auth.java.jwt.untrusted-verify-key
        return Jwts.parser().verifyWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(secret))
            .build().parseSignedClaims(token);
    }

    // nimbus: the HMAC secret handed to the verifier is request-controlled.
    boolean nimbus(HttpServletRequest request, SignedJWT jwt) throws Exception {
        byte[] secret = request.getParameter("secret").getBytes();
        // ruleid: auth.java.jwt.untrusted-verify-key
        return jwt.verify(new MACVerifier(secret));
    }
}
