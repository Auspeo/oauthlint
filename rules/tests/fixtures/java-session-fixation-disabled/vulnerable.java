import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.session.fixation-disabled
        http.sessionManagement().sessionFixation().none();
        return http.build();
    }

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.session.fixation-disabled
        http.sessionManagement(session -> session.sessionFixation(fixation -> fixation.none()));
        return http.build();
    }
}
