import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;

@RestController
class CorsControllerSafe {

    // ok: auth.java.cors.allow-all -- explicit trusted origin, not a wildcard
    @CrossOrigin(origins = "https://app.example.com")
    @GetMapping("/scoped")
    String scoped() {
        return "ok";
    }

    CorsConfiguration addAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ok: auth.java.cors.allow-all -- explicit trusted origin
        config.addAllowedOrigin("https://app.example.com");
        return config;
    }

    CorsConfiguration setAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ok: auth.java.cors.allow-all -- allowlist of explicit origins
        config.setAllowedOrigins(Arrays.asList("https://app.example.com", "https://admin.example.com"));
        return config;
    }

    CorsConfiguration setAllowedSingle() {
        CorsConfiguration config = new CorsConfiguration();
        // ok: auth.java.cors.allow-all -- single explicit origin
        config.setAllowedOrigins(List.of("https://app.example.com"));
        return config;
    }
}
