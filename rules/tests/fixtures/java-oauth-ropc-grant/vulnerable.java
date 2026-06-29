import okhttp3.FormBody;
import okhttp3.RequestBody;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

class TokenClient {

    // Spring WebClient / RestTemplate form body built as a MultiValueMap.
    MultiValueMap<String, String> springBody(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        // ruleid: auth.java.oauth.ropc-grant
        form.add("grant_type", "password");
        form.add("username", username);
        form.add("password", password);
        return form;
    }

    // OkHttp form body builder.
    RequestBody okhttpBody(String username, String password) {
        // ruleid: auth.java.oauth.ropc-grant
        return new FormBody.Builder()
            .add("grant_type", "password")
            .add("username", username)
            .add("password", password)
            .build();
    }

    // Raw URL-encoded request body string.
    String rawBody(String username, String password) {
        // ruleid: auth.java.oauth.ropc-grant
        return "grant_type=password&username=" + username + "&password=" + password;
    }
}
