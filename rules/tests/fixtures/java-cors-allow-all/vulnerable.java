import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;

@RestController
class CorsControllerVulnerable {

    // ruleid: auth.java.cors.allow-all
    @CrossOrigin(origins = "*")
    @GetMapping("/explicit")
    String explicit() {
        return "open";
    }

    // ruleid: auth.java.cors.allow-all
    @CrossOrigin
    @GetMapping("/bare")
    String bare() {
        return "open";
    }

    CorsConfiguration addAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ruleid: auth.java.cors.allow-all
        config.addAllowedOrigin("*");
        return config;
    }

    CorsConfiguration setAllowed() {
        CorsConfiguration config = new CorsConfiguration();
        // ruleid: auth.java.cors.allow-all
        config.setAllowedOrigins(List.of("*"));
        return config;
    }
}
