import okhttp3.FormBody;
import okhttp3.RequestBody;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

class TokenClient {

    // Authorization-code exchange — the correct user-login grant.
    MultiValueMap<String, String> authCodeBody(String code, String verifier) {
        // ok: auth.java.oauth.ropc-grant
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("code_verifier", verifier);
        return form;
    }

    // Client-credentials grant for machine-to-machine.
    RequestBody clientCredsBody() {
        // ok: auth.java.oauth.ropc-grant
        return new FormBody.Builder()
            .add("grant_type", "client_credentials")
            .add("scope", "read")
            .build();
    }

    // True-negative trap: an unrelated field that merely contains the substring
    // "password", and a password-reset action — neither is a ROPC token request.
    String resetBody(String email) {
        // ok: auth.java.oauth.ropc-grant
        return "action=password_reset&email=" + email;
    }

    String labelledField(String value) {
        // ok: auth.java.oauth.ropc-grant
        return "new_password=" + value;
    }
}
