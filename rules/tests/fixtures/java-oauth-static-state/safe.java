import java.security.SecureRandom;
import java.util.Base64;

class AuthorizeRequest {

    // Per-request state generated from a CSPRNG and appended by concatenation —
    // the literal ends right after `state=`, so no constant value is present.
    String build(String clientId) {
        // ok: auth.java.oauth.static-state
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String state = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return "https://idp.example.com/authorize?response_type=code&client_id=" + clientId
            + "&state=" + state;
    }

    // True-negative trap: a URL with a constant `state=` but NO response_type,
    // so it is not an authorize request and must not be flagged.
    String unrelated() {
        // ok: auth.java.oauth.static-state
        return "https://app.example.com/page?state=open&tab=1";
    }
}
