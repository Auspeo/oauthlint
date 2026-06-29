import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;

@RestController
class AccountController {

    // Explicit trusted origin with credentials — the correct configuration.
    // ok: auth.java.cors.credentialed-wildcard
    @CrossOrigin(origins = "https://app.example.com", allowCredentials = "true")
    @GetMapping("/me")
    String me() {
        return "account";
    }

    // True-negative trap: a wildcard origin WITHOUT credentials is a different
    // (and separately linted) concern, not a credentialed wildcard.
    // ok: auth.java.cors.credentialed-wildcard
    @CrossOrigin(origins = "*")
    @GetMapping("/public")
    String publicData() {
        return "public";
    }

    // Programmatic config with an explicit allowlist and credentials.
    CorsConfiguration config() {
        CorsConfiguration cfg = new CorsConfiguration();
        // ok: auth.java.cors.credentialed-wildcard
        cfg.setAllowedOrigins(List.of("https://app.example.com"));
        cfg.setAllowCredentials(true);
        return cfg;
    }
}
