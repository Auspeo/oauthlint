import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.csrf-disabled
        http.csrf().disable();
        return http.build();
    }

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.csrf-disabled
        http.csrf(csrf -> csrf.disable());
        return http.build();
    }

    SecurityFilterChain methodRef(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.csrf-disabled
        http.csrf(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
