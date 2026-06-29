import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;

@RestController
class AccountController {

    // Annotation: wildcard origin together with credentials.
    // ruleid: auth.java.cors.credentialed-wildcard
    @CrossOrigin(origins = "*", allowCredentials = "true")
    @GetMapping("/me")
    String me() {
        return "account";
    }

    // Programmatic: the origin-pattern wildcard API, which only exists to allow
    // `*` with credentials.
    CorsConfiguration config() {
        CorsConfiguration cfg = new CorsConfiguration();
        // ruleid: auth.java.cors.credentialed-wildcard
        cfg.addAllowedOriginPattern("*");
        cfg.setAllowCredentials(true);
        return cfg;
    }
}
