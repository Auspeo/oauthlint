import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain fluent(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.frame-options-disabled
        http.headers().frameOptions().disable();
        return http.build();
    }

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.frame-options-disabled
        http.headers(h -> h.frameOptions(f -> f.disable()));
        return http.build();
    }

    SecurityFilterChain methodRef(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.frame-options-disabled
        http.headers(h -> h.frameOptions(FrameOptionsConfig::disable));
        return http.build();
    }
}
