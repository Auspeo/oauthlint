import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    SecurityFilterChain fluent(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all
        http.authorizeHttpRequests().anyRequest().permitAll();
        return http.build();
    }

    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all
        http.authorizeRequests().anyRequest().permitAll();
        return http.build();
    }
}
